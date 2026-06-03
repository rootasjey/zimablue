import { db, schema } from 'hub:db'
import { blob } from 'hub:blob'
import { and, asc, eq, isNull, lte, or, sql } from 'drizzle-orm'
import {
  SOCIAL_AUTOPOST_PLATFORMS,
  buildSocialPostText,
  getAutopostMaxDurationMs,
  normalizeHashtagString,
  runSocialAutopostQueue,
  type SocialAutopostBatchResult,
  type SocialAutopostExecutionResult,
  type SocialAutopostPlatform,
  type SocialAutopostQueueLoader,
  type SocialAutopostQueueProcessor,
  type SocialAutopostRunOptions,
} from '@verbatims/social-autopost-core'
import { buildXAuthHeaders, getXAuthConfig, getXCredentialErrorMessage, withXUserContextHint, type XAuthConfig } from './social-x-auth'
import { resolveFacebookPostConfig, resolveInstagramPostConfig, resolveThreadsPostConfig } from './social-meta-config'
import { getEnabledSocialAutopostPlatforms, resolveBlueskyProviderConfig, resolveXProviderConfig } from './social-provider-config'
import { getZimablueFallbackCanonicalUrl, zimablueSocialPublishableSourceResolver } from './social-autopost-zimablue'

interface PublishResult {
  ok: boolean
  postId?: string
  postUrl?: string
  error?: string
}

interface QueueCandidate {
  queueId: number
  imageId: number
  platform: SocialAutopostPlatform
  sourceType: string
  sourceId: number
}

interface SocialAutopostSuccessResult {
  success: true
  queueId: number
  imageId: number
  platform: SocialAutopostPlatform
  postText: string
  canonicalUrl: string
  postId?: string
  postUrl?: string
}

interface SocialAutopostFailureResult {
  success: false
  queueId: number
  imageId: number
  platform: SocialAutopostPlatform
  reason: string
}

type BlueskyFacet = {
  index: {
    byteStart: number
    byteEnd: number
  }
  features: Array<
    { $type: 'app.bsky.richtext.facet#link', uri: string }
    | { $type: 'app.bsky.richtext.facet#tag', tag: string }
  >
}

type SocialAutopostProcessedResult = SocialAutopostSuccessResult | SocialAutopostFailureResult
type ZimablueAutopostResult = SocialAutopostExecutionResult<SocialAutopostPlatform, SocialAutopostProcessedResult>

const utf8Encoder = new TextEncoder()

async function proactivelyRefreshTokens(runtimeConfig: ReturnType<typeof useRuntimeConfig>, enabledPlatforms: SocialAutopostPlatform[]) {
  const refreshable: { platform: 'threads' | 'instagram' | 'facebook'; config: Promise<any>; tokenKey: string }[] = []
  if (enabledPlatforms.includes('threads')) {
    refreshable.push({ platform: 'threads', config: resolveThreadsPostConfig(runtimeConfig), tokenKey: 'accessToken' })
  }
  if (enabledPlatforms.includes('instagram')) {
    refreshable.push({ platform: 'instagram', config: resolveInstagramPostConfig(runtimeConfig), tokenKey: 'accessToken' })
  }
  if (enabledPlatforms.includes('facebook')) {
    refreshable.push({ platform: 'facebook', config: resolveFacebookPostConfig(runtimeConfig), tokenKey: 'pageAccessToken' })
  }

  for (const entry of refreshable) {
    const resolved = await entry.config
    const currentToken = entry.platform === 'facebook' ? (resolved as any).pageAccessToken : resolved.accessToken
    if (!currentToken) continue

    const result = await tryRefreshToken(resolved as any, entry.platform === 'threads' ? 'threads' : 'meta')
    if (typeof result === 'string') {
      await saveAccessTokenToKv(entry.platform, result)
    } else if (result === undefined) {
      console.warn(`[social-autopost] ${entry.platform} token is expired — re-authentication required`)
    }
  }
}

export async function runSocialAutopost() {
  return runSocialAutopostWithOptions({ force: false })
}

export async function runSocialAutopostWithOptions(options: SocialAutopostRunOptions = {}): Promise<
  ZimablueAutopostResult | SocialAutopostBatchResult<ZimablueAutopostResult>
> {
  const runtimeConfig = useRuntimeConfig()
  const socialAutopost = runtimeConfig.socialAutopost || {}
  const enabledPlatforms = await getEnabledSocialAutopostPlatforms(runtimeConfig)

  await proactivelyRefreshTokens(runtimeConfig, enabledPlatforms)

  const timezone = String(socialAutopost.timezone || 'Europe/Paris')
  const targetTime = String(socialAutopost.targetTime || '09:00')
  const siteUrl = String(options.baseSiteUrl || runtimeConfig.public.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
  const maxDurationMs = getAutopostMaxDurationMs(socialAutopost.maxDurationMs)

  return runSocialAutopostQueue({
    enabledPlatforms,
    options,
    timezone,
    targetTime,
    baseSiteUrl: siteUrl,
    maxDurationMs,
    getNextQueuedItem,
    processQueueCandidate,
    noQueuedReason: 'no queued illustration available'
  })
}

const getNextQueuedItem: SocialAutopostQueueLoader<SocialAutopostPlatform, QueueCandidate> = async (platform, now) => {
  return db.select({
    queueId: schema.socialQueue.id,
    imageId: schema.socialQueue.imageId,
    platform: schema.socialQueue.platform,
    sourceType: schema.socialQueue.sourceType,
    sourceId: schema.socialQueue.sourceId,
  })
    .from(schema.socialQueue)
    .where(and(
      eq(schema.socialQueue.platform, platform),
      eq(schema.socialQueue.status, 'queued'),
      or(
        isNull(schema.socialQueue.scheduledFor),
        lte(schema.socialQueue.scheduledFor, now)
      )
    ))
    .orderBy(asc(schema.socialQueue.position), asc(schema.socialQueue.id))
    .limit(1)
    .get()
}

const processQueueCandidate: SocialAutopostQueueProcessor<SocialAutopostPlatform, QueueCandidate, SocialAutopostProcessedResult> = async (nextItem, context) => {
  const claimed = await db.update(schema.socialQueue)
    .set({
      status: 'processing',
      lastError: null,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(and(
      eq(schema.socialQueue.id, nextItem.queueId),
      eq(schema.socialQueue.status, 'queued')
    ))
    .returning({ id: schema.socialQueue.id })

  if (!claimed.length) {
    return {
      skipped: true,
      platform: nextItem.platform,
      reason: 'queue item already claimed',
    }
  }

  const resolvedContent = await zimablueSocialPublishableSourceResolver.resolveSource({
    sourceType: nextItem.sourceType,
    sourceId: nextItem.sourceId,
    baseSiteUrl: context.baseSiteUrl,
    platform: nextItem.platform,
  })

  if (!resolvedContent) {
    const canonicalUrl = getZimablueFallbackCanonicalUrl({
      sourceType: nextItem.sourceType,
      sourceId: nextItem.sourceId,
      imageId: nextItem.imageId,
      baseSiteUrl: context.baseSiteUrl,
    })

    await markQueueAsFailed({
      queueId: nextItem.queueId,
      imageId: nextItem.imageId,
      sourceType: nextItem.sourceType,
      sourceId: nextItem.sourceId,
      platform: nextItem.platform,
      reason: 'Image source is missing or incomplete',
      canonicalUrl,
    })

    return {
      success: false,
      queueId: nextItem.queueId,
      imageId: nextItem.imageId,
      platform: nextItem.platform,
      reason: 'image source is missing or incomplete',
    }
  }

  const canonicalUrl = resolvedContent.content.canonicalUrl || getZimablueFallbackCanonicalUrl({
    sourceType: nextItem.sourceType,
    sourceId: nextItem.sourceId,
    imageId: nextItem.imageId,
    baseSiteUrl: context.baseSiteUrl,
  })
  const blueskyConfig = nextItem.platform === 'bluesky'
    ? await resolveBlueskyProviderConfig()
    : null
  const blueskyHashtags = nextItem.platform === 'bluesky'
    ? buildBlueskyHashtags(resolvedContent.content.hashtags, blueskyConfig?.hashtags)
    : undefined
  const instagramHashtags = nextItem.platform === 'instagram'
    ? buildInstagramHashtags(resolvedContent.content.hashtags)
    : undefined
  const description = resolvedContent.content.description?.trim()
  const postText = buildSocialPostText(nextItem.platform, {
    ...resolvedContent.content,
    canonicalUrl,
  }, {
    blueskyHashtags,
    instagramHashtags,
  })
  const finalPostText = description
    ? injectDescriptionIntoText(postText, description, nextItem.platform)
    : postText

  const publishResult = await publishByPlatform(nextItem.platform, {
    text: finalPostText,
    canonicalUrl,
    imageUrl: resolvedContent.media?.url || '',
    alt: resolvedContent.media?.alt,
    blueskyHashtags,
  })

  if (!publishResult.ok) {
    await markQueueAsFailed({
      queueId: nextItem.queueId,
      imageId: nextItem.imageId,
      sourceType: resolvedContent.content.sourceType,
      sourceId: Number(resolvedContent.content.sourceId),
      platform: nextItem.platform,
      reason: publishResult.error || `${nextItem.platform} publish failed`,
      canonicalUrl,
    postText: finalPostText,
    })

    return {
      success: false,
      queueId: nextItem.queueId,
      imageId: nextItem.imageId,
      platform: nextItem.platform,
      reason: publishResult.error || `${nextItem.platform} publish failed`,
    }
  }

  await db.insert(schema.socialPosts).values({
    imageId: nextItem.imageId,
    queueId: nextItem.queueId,
    sourceType: resolvedContent.content.sourceType,
    sourceId: Number(resolvedContent.content.sourceId),
    platform: nextItem.platform,
    status: 'success',
    postText: finalPostText,
    postUrl: publishResult.postUrl || canonicalUrl,
    externalPostId: publishResult.postId,
    idempotencyKey: `${nextItem.platform}:${nextItem.queueId}`,
    postedAt: new Date(),
  })

  await db.update(schema.socialQueue)
    .set({
      status: 'posted',
      lastError: null,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(schema.socialQueue.id, nextItem.queueId))

  return {
    success: true,
    queueId: nextItem.queueId,
    imageId: nextItem.imageId,
    platform: nextItem.platform,
    postText,
    canonicalUrl,
    postId: publishResult.postId,
    postUrl: publishResult.postUrl,
  }
}

async function markQueueAsFailed(input: {
  queueId: number
  imageId: number
  sourceType: string
  sourceId: number
  platform: SocialAutopostPlatform
  reason: string
  canonicalUrl: string
  postText?: string
}) {
  await db.insert(schema.socialPosts).values({
    imageId: input.imageId,
    queueId: input.queueId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    platform: input.platform,
    status: 'failed',
    postText: input.postText,
    postUrl: input.canonicalUrl,
    idempotencyKey: `${input.platform}:${input.queueId}:failed:${Date.now()}`,
    errorMessage: input.reason,
    postedAt: new Date(),
  })

  await db.update(schema.socialQueue)
    .set({
      status: 'failed',
      lastError: input.reason,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(schema.socialQueue.id, input.queueId))
}

async function publishByPlatform(platform: SocialAutopostPlatform, payload: {
  text: string
  canonicalUrl: string
  imageUrl: string
  alt?: string
  blueskyHashtags?: string
}): Promise<PublishResult> {
  if (platform === 'bluesky') {
    return postToBluesky(payload)
  }

  if (platform === 'instagram') {
    return postToInstagram(payload.text, payload.imageUrl)
  }

  if (platform === 'threads') {
    return postToThreads(payload.text, payload.imageUrl)
  }

  if (platform === 'facebook') {
    return postToFacebook(payload.text, payload.imageUrl)
  }

  if (platform === 'x') {
    return postToX(payload.text, payload.imageUrl)
  }

  return { ok: false, error: `${platform} provider is not implemented yet` }
}

async function postToX(text: string, imageUrl: string): Promise<PublishResult> {
  const resolvedX = await resolveXProviderConfig()
  const auth = getXAuthConfig({
    oauth2AccessToken: resolvedX.oauth2AccessToken,
    oauth1ConsumerKey: resolvedX.oauth1ConsumerKey,
    oauth1ConsumerSecret: resolvedX.oauth1ConsumerSecret,
    oauth1AccessToken: resolvedX.oauth1AccessToken,
    oauth1AccessTokenSecret: resolvedX.oauth1AccessTokenSecret,
  })

  if (auth.mode === 'none') {
    return { ok: false, error: getXCredentialErrorMessage() }
  }

  try {
    let mediaId: string | undefined
    try {
      mediaId = await uploadXMedia({ auth, imageUrl })
    } catch (error: any) {
      if (resolvedX.requireMedia) {
        return { ok: false, error: error?.message || 'Failed to upload image to X' }
      }
      console.warn('[social-autopost] X media upload failed, falling back to text-only post:', error?.message || error)
    }

    const authHeaders = await buildXAuthHeaders({
      method: 'POST',
      url: 'https://api.x.com/2/tweets',
      auth,
    })

    const response = await fetch('https://api.x.com/2/tweets', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mediaId ? { text, media: { media_ids: [mediaId] } } : { text })
    })

    const payload = await response.json().catch(() => null) as {
      data?: { id?: string }
      detail?: string
      title?: string
    } | null

    if (!response.ok) {
      return { ok: false, error: withXUserContextHint(payload?.detail || payload?.title || `X API error (${response.status})`) }
    }

    const postId = payload?.data?.id
    return { ok: true, postId, postUrl: postId ? `https://x.com/i/web/status/${postId}` : undefined }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Network error while posting to X' }
  }
}

async function uploadXMedia(input: { auth: XAuthConfig, imageUrl: string }): Promise<string> {
  if (input.auth.mode !== 'oauth1') {
    throw new Error('X media upload requires OAuth 1.0a user context (NUXT_X_POST_OAUTH1_*).')
  }

  const image = await fetchImagePayload(input.imageUrl)
  const form = new FormData()
  form.append('media', new Blob([image.bytes], { type: image.contentType }), 'illustration.jpg')

  const headers = await buildXAuthHeaders({
    method: 'POST',
    url: 'https://upload.twitter.com/1.1/media/upload.json',
    auth: input.auth,
  })

  const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers,
    body: form,
  })

  const payload = await response.json().catch(() => null) as {
    media_id_string?: string
    errors?: Array<{ message?: string }>
    detail?: string
    title?: string
  } | null

  if (!response.ok || !payload?.media_id_string) {
    throw new Error(withXUserContextHint(payload?.errors?.[0]?.message || payload?.detail || payload?.title || `X media upload error (${response.status})`))
  }

  return payload.media_id_string
}

async function postToBluesky(payload: {
  text: string
  canonicalUrl: string
  imageUrl: string
  alt?: string
  blueskyHashtags?: string
}): Promise<PublishResult> {
  const resolved = await resolveBlueskyProviderConfig()
  if (!resolved.enabled) {
    return { ok: false, error: 'Bluesky provider is disabled' }
  }

  if (!resolved.identifier || !resolved.password) {
    return { ok: false, error: 'Missing Bluesky identifier or password' }
  }

  try {
    const sessionResponse = await fetch(`${resolved.service}/xrpc/com.atproto.server.createSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: resolved.identifier, password: resolved.password }),
    })

    const sessionPayload = await sessionResponse.json().catch(() => null) as {
      accessJwt?: string
      did?: string
      handle?: string
      message?: string
      error?: string
    } | null

    if (!sessionResponse.ok || !sessionPayload?.accessJwt || !sessionPayload.did || !sessionPayload.handle) {
      return { ok: false, error: sessionPayload?.message || sessionPayload?.error || `Bluesky session error (${sessionResponse.status})` }
    }

    const imagePayload = await fetchImagePayload(payload.imageUrl)
    const uploadResponse = await fetch(`${resolved.service}/xrpc/com.atproto.repo.uploadBlob`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionPayload.accessJwt}`,
        'Content-Type': imagePayload.contentType,
      },
      body: imagePayload.bytes,
    })

    const uploadPayload = await uploadResponse.json().catch(() => null) as {
      blob?: unknown
      message?: string
      error?: string
    } | null

    if (!uploadResponse.ok || !uploadPayload?.blob) {
      return { ok: false, error: uploadPayload?.message || uploadPayload?.error || `Bluesky image upload error (${uploadResponse.status})` }
    }

    const facets = buildBlueskyFacets(payload.text, payload.canonicalUrl, payload.blueskyHashtags)
    const recordResponse = await fetch(`${resolved.service}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionPayload.accessJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repo: sessionPayload.did,
        collection: 'app.bsky.feed.post',
        record: {
          $type: 'app.bsky.feed.post',
          text: payload.text,
          createdAt: new Date().toISOString(),
          ...(facets ? { facets } : {}),
          embed: {
            $type: 'app.bsky.embed.images',
            images: [
              {
                alt: payload.alt || 'Illustration',
                image: uploadPayload.blob,
              }
            ]
          }
        }
      })
    })

    const recordPayload = await recordResponse.json().catch(() => null) as {
      uri?: string
      message?: string
      error?: string
    } | null

    if (!recordResponse.ok || !recordPayload?.uri) {
      return { ok: false, error: recordPayload?.message || recordPayload?.error || `Bluesky post error (${recordResponse.status})` }
    }

    const postKey = recordPayload.uri.split('/').pop() || ''
    return {
      ok: true,
      postId: recordPayload.uri,
      postUrl: postKey ? `https://bsky.app/profile/${sessionPayload.handle}/post/${postKey}` : undefined,
    }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Network error while posting to Bluesky' }
  }
}

async function postToInstagram(caption: string, imageUrl: string): Promise<PublishResult> {
  const resolved = await resolveInstagramPostConfig()
  if (!resolved.accessToken || !resolved.userId) {
    return { ok: false, error: 'Missing Instagram access token or user id' }
  }

  const refreshResult = await tryRefreshToken(resolved, 'meta')
  if (refreshResult === undefined) {
    return { ok: false, error: 'Instagram access token has expired. Please re-authenticate via the admin social settings.' }
  }
  const effectiveToken = refreshResult || resolved.accessToken
  if (refreshResult) {
    await saveAccessTokenToKv('instagram', refreshResult)
  }

  try {
    const createContainerResponse = await fetch(`${resolved.baseUrl}/${resolved.apiVersion}/${resolved.userId}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${effectiveToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: imageUrl, caption }),
    })

    const createContainerPayload = await createContainerResponse.json().catch(() => null) as { id?: string, error?: { message?: string } } | null
    if (!createContainerResponse.ok || !createContainerPayload?.id) {
      return { ok: false, error: readGraphApiError(createContainerPayload, `Instagram media container error (${createContainerResponse.status})`) }
    }

    const readyStatus = await waitForInstagramContainerReady({
      baseUrl: resolved.baseUrl,
      apiVersion: resolved.apiVersion,
      accessToken: effectiveToken,
      containerId: createContainerPayload.id,
      pollIntervalMs: resolved.pollIntervalMs,
      pollTimeoutMs: resolved.pollTimeoutMs,
    })

    if (!readyStatus.ok) {
      return { ok: false, error: readyStatus.error }
    }

    const publishResponse = await fetch(`${resolved.baseUrl}/${resolved.apiVersion}/${resolved.userId}/media_publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${effectiveToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ creation_id: createContainerPayload.id }),
    })

    const publishPayload = await publishResponse.json().catch(() => null) as { id?: string, error?: { message?: string } } | null
    if (!publishResponse.ok || !publishPayload?.id) {
      return { ok: false, error: readGraphApiError(publishPayload, `Instagram publish error (${publishResponse.status})`) }
    }

    const postUrl = await getInstagramPermalink({
      baseUrl: resolved.baseUrl,
      apiVersion: resolved.apiVersion,
      accessToken: effectiveToken,
      mediaId: publishPayload.id,
    })

    return { ok: true, postId: publishPayload.id, postUrl: postUrl || undefined }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Network error while posting to Instagram' }
  }
}

async function postToThreads(text: string, imageUrl: string): Promise<PublishResult> {
  const resolved = await resolveThreadsPostConfig()
  if (!resolved.accessToken || !resolved.userId) {
    return { ok: false, error: 'Missing Threads access token or user id' }
  }

  const refreshResult = await tryRefreshToken(resolved, 'threads')
  if (refreshResult === undefined) {
    return { ok: false, error: 'Threads access token has expired. Please re-authenticate via the admin social settings.' }
  }
  const effectiveToken = refreshResult || resolved.accessToken
  if (refreshResult) {
    await saveAccessTokenToKv('threads', refreshResult)
  }

  try {
    const createContainerResponse = await fetch(`${resolved.baseUrl}/${resolved.apiVersion}/${resolved.userId}/threads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${effectiveToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ media_type: 'IMAGE', image_url: imageUrl, text }),
    })

    const createContainerPayload = await createContainerResponse.json().catch(() => null) as { id?: string, error?: { message?: string } } | null
    if (!createContainerResponse.ok || !createContainerPayload?.id) {
      return { ok: false, error: readGraphApiError(createContainerPayload, `Threads container creation error (${createContainerResponse.status})`) }
    }

    const readyStatus = await waitForThreadsContainerReady({
      baseUrl: resolved.baseUrl,
      apiVersion: resolved.apiVersion,
      accessToken: effectiveToken,
      containerId: createContainerPayload.id,
      pollIntervalMs: resolved.pollIntervalMs,
      pollTimeoutMs: resolved.pollTimeoutMs,
    })

    if (!readyStatus.ok) {
      return { ok: false, error: readyStatus.error }
    }

    const publishResponse = await fetch(`${resolved.baseUrl}/${resolved.apiVersion}/${resolved.userId}/threads_publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${effectiveToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ creation_id: createContainerPayload.id }),
    })

    const publishPayload = await publishResponse.json().catch(() => null) as { id?: string, error?: { message?: string } } | null
    if (!publishResponse.ok || !publishPayload?.id) {
      return { ok: false, error: readGraphApiError(publishPayload, `Threads publish error (${publishResponse.status})`) }
    }

    const postUrl = await getThreadsPermalink({
      baseUrl: resolved.baseUrl,
      apiVersion: resolved.apiVersion,
      accessToken: effectiveToken,
      mediaId: publishPayload.id,
    })

    return { ok: true, postId: publishPayload.id, postUrl: postUrl || undefined }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Network error while posting to Threads' }
  }
}

async function postToFacebook(message: string, imageUrl: string): Promise<PublishResult> {
  const resolved = await resolveFacebookPostConfig()
  if (!resolved.pageAccessToken || !resolved.pageId) {
    return { ok: false, error: 'Missing Facebook page token or page id' }
  }

  const refreshResult = await tryRefreshToken({ ...resolved, accessToken: resolved.pageAccessToken }, 'meta')
  if (refreshResult === undefined) {
    return { ok: false, error: 'Facebook access token has expired. Please re-authenticate via the admin social settings.' }
  }
  const effectiveToken = refreshResult || resolved.pageAccessToken
  if (refreshResult) {
    await saveAccessTokenToKv('facebook', refreshResult)
    resolved.pageAccessToken = refreshResult
  }

  try {
    const response = await fetch(`${resolved.baseUrl}/${resolved.apiVersion}/${resolved.pageId}/photos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${effectiveToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: imageUrl, message, published: true }),
    })

    const payload = await response.json().catch(() => null) as { id?: string, post_id?: string, error?: { message?: string } } | null
    if (!response.ok || (!payload?.id && !payload?.post_id)) {
      return { ok: false, error: readGraphApiError(payload, `Facebook publish error (${response.status})`) }
    }

    const postId = payload.post_id || payload.id
    return { ok: true, postId, postUrl: postId ? `https://www.facebook.com/${postId}` : undefined }
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Network error while posting to Facebook' }
  }
}

async function fetchImagePayload(imageUrl: string): Promise<{ bytes: ArrayBuffer, contentType: string }> {
  const runtimeConfig = useRuntimeConfig()
  const siteUrl = String(runtimeConfig.public.siteUrl || '').replace(/\/$/, '')

  if (siteUrl && imageUrl.startsWith(siteUrl)) {
    try {
      const { pathname } = new URL(imageUrl)
      const imageDbPath = pathname.replace(/^\//, '')

      const imageData = await db.select({ variants: schema.images.variants })
        .from(schema.images)
        .where(eq(schema.images.pathname, imageDbPath))
        .limit(1)
        .get()

      const variantList: Array<{ pathname: string; size: string }> =
        imageData?.variants ? JSON.parse(imageData.variants as string) : []

      const bestVariant = variantList.find((v) => v.size === 'lg')
        || variantList.find((v) => v.size === 'md')
        || variantList[0]

      if (bestVariant) {
        const blobData = await blob.get(bestVariant.pathname)
        if (blobData) {
          return {
            bytes: await blobData.arrayBuffer(),
            contentType: blobData.type || 'image/jpeg',
          }
        }
      }
    } catch (error) {
      console.warn('[social-autopost] unable to read image from R2, falling back to HTTP:', error)
    }
  }

  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image asset (${response.status})`)
  }

  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get('content-type') || 'image/jpeg',
  }
}

function buildBlueskyHashtags(tags: string[] | undefined, source?: string): string {
  const inlineTags = Array.isArray(tags) ? tags.map(tag => `#${String(tag).replace(/[^\p{L}\p{N}_]+/gu, '')}`).join(' ') : ''
  return normalizeHashtagString(`${source || ''} ${inlineTags}`.trim(), 4)
}

function buildInstagramHashtags(tags: string[] | undefined): string {
  const inlineTags = Array.isArray(tags) ? tags.map(tag => `#${String(tag).replace(/[^\p{L}\p{N}_]+/gu, '')}`).join(' ') : ''
  return normalizeHashtagString(inlineTags, 12)
}

function buildBlueskyFacets(text: string, canonicalUrl: string, hashtagsSource?: string): BlueskyFacet[] | undefined {
  const facets: BlueskyFacet[] = []
  const hashtags = buildBlueskyHashtags([], hashtagsSource)
    .split(/\s+/)
    .map(part => part.trim())
    .filter(Boolean)

  const linkStart = text.lastIndexOf(canonicalUrl)
  if (linkStart !== -1) {
    facets.push({
      index: buildBlueskyFacetIndex(text, linkStart, linkStart + canonicalUrl.length),
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: canonicalUrl }]
    })
  }

  let searchFrom = linkStart === -1 ? 0 : linkStart + canonicalUrl.length
  for (const hashtag of hashtags) {
    const hashtagStart = text.indexOf(hashtag, searchFrom)
    if (hashtagStart === -1) continue

    facets.push({
      index: buildBlueskyFacetIndex(text, hashtagStart, hashtagStart + hashtag.length),
      features: [{ $type: 'app.bsky.richtext.facet#tag', tag: hashtag.slice(1) }]
    })
    searchFrom = hashtagStart + hashtag.length
  }

  return facets.length ? facets : undefined
}

function buildBlueskyFacetIndex(text: string, start: number, end: number) {
  return {
    byteStart: utf16IndexToUtf8Index(text, start),
    byteEnd: utf16IndexToUtf8Index(text, end),
  }
}

function utf16IndexToUtf8Index(text: string, index: number): number {
  return utf8Encoder.encode(text.slice(0, index)).byteLength
}

async function waitForInstagramContainerReady(input: {
  baseUrl: string
  apiVersion: string
  accessToken: string
  containerId: string
  pollIntervalMs: number
  pollTimeoutMs: number
}): Promise<{ ok: boolean, error?: string }> {
  const startedAt = Date.now()
  while ((Date.now() - startedAt) < input.pollTimeoutMs) {
    const response = await fetch(`${input.baseUrl}/${input.apiVersion}/${input.containerId}?fields=status_code,status`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${input.accessToken}` },
    })
    const payload = await response.json().catch(() => null) as { status_code?: string, status?: string, error?: { message?: string } } | null
    if (!response.ok) {
      return { ok: false, error: readGraphApiError(payload, `Instagram container status error (${response.status})`) }
    }

    const status = String(payload?.status_code || payload?.status || '').toUpperCase()
    if (status === 'FINISHED' || status === 'PUBLISHED') {
      return { ok: true }
    }
    if (status === 'ERROR' || status === 'EXPIRED') {
      return { ok: false, error: payload?.error?.message || `Instagram container is ${status.toLowerCase()}` }
    }

    await delay(input.pollIntervalMs)
  }

  return { ok: false, error: 'Timed out while waiting for Instagram media processing' }
}

async function waitForThreadsContainerReady(input: {
  baseUrl: string
  apiVersion: string
  accessToken: string
  containerId: string
  pollIntervalMs: number
  pollTimeoutMs: number
}): Promise<{ ok: boolean, error?: string }> {
  const startedAt = Date.now()
  while ((Date.now() - startedAt) < input.pollTimeoutMs) {
    const response = await fetch(`${input.baseUrl}/${input.apiVersion}/${input.containerId}?fields=status`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${input.accessToken}` },
    })
    const payload = await response.json().catch(() => null) as { status?: string, error?: { message?: string } } | null
    if (!response.ok) {
      return { ok: false, error: readGraphApiError(payload, `Threads container status error (${response.status})`) }
    }

    const status = String(payload?.status || '').toUpperCase()
    if (status === 'FINISHED' || status === 'PUBLISHED') {
      return { ok: true }
    }
    if (status === 'ERROR' || status === 'EXPIRED') {
      return { ok: false, error: payload?.error?.message || `Threads container is ${status.toLowerCase()}` }
    }

    await delay(input.pollIntervalMs)
  }

  return { ok: false, error: 'Timed out while waiting for Threads media processing' }
}

async function getInstagramPermalink(input: {
  baseUrl: string
  apiVersion: string
  accessToken: string
  mediaId: string
}): Promise<string | null> {
  try {
    const response = await fetch(`${input.baseUrl}/${input.apiVersion}/${input.mediaId}?fields=permalink`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${input.accessToken}` },
    })
    const payload = await response.json().catch(() => null) as { permalink?: string } | null
    return response.ok ? payload?.permalink || null : null
  } catch {
    return null
  }
}

async function getThreadsPermalink(input: {
  baseUrl: string
  apiVersion: string
  accessToken: string
  mediaId: string
}): Promise<string | null> {
  try {
    const response = await fetch(`${input.baseUrl}/${input.apiVersion}/${input.mediaId}?fields=permalink`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${input.accessToken}` },
    })
    const payload = await response.json().catch(() => null) as { permalink?: string } | null
    return response.ok ? payload?.permalink || null : null
  } catch {
    return null
  }
}

function readGraphApiError(payload: { error?: { message?: string } } | null | undefined, fallback: string): string {
  return payload?.error?.message || fallback
}

async function tryRefreshToken(resolved: { accessToken: string; appId?: string; appSecret?: string; metaAppId?: string; metaAppSecret?: string; apiVersion: string; baseUrl: string }, platform: 'threads' | 'meta'): Promise<string | null | undefined> {
  try {
    if (platform === 'threads') {
      const refreshUrl = new URL(`${resolved.baseUrl}/${resolved.apiVersion}/refresh_access_token`)
      refreshUrl.searchParams.set('grant_type', 'th_refresh_token')
      refreshUrl.searchParams.set('access_token', resolved.accessToken)
      const res = await fetch(refreshUrl.toString())
      const payload = await res.json() as { access_token?: string; error?: { message?: string } } | null
      if (res.ok && payload?.access_token) {
        if (payload.access_token !== resolved.accessToken) {
          return payload.access_token
        }
        return null
      }
      return undefined
    }

    const appId = resolved.metaAppId || resolved.appId
    const appSecret = resolved.metaAppSecret || resolved.appSecret
    if (!appId || !appSecret) return null

    const refreshUrl = new URL(`${resolved.baseUrl}/${resolved.apiVersion}/oauth/access_token`)
    refreshUrl.searchParams.set('grant_type', 'fb_exchange_token')
    refreshUrl.searchParams.set('client_id', appId)
    refreshUrl.searchParams.set('client_secret', appSecret)
    refreshUrl.searchParams.set('fb_exchange_token', resolved.accessToken)
    const res = await fetch(refreshUrl.toString())
    const payload = await res.json() as { access_token?: string; error?: { message?: string } } | null
    if (res.ok && payload?.access_token) {
      if (payload.access_token !== resolved.accessToken) {
        return payload.access_token
      }
      return null
    }
    return undefined
  } catch {
    return null
  }
}

async function saveAccessTokenToKv(platform: string, newToken: string) {
  try {
    const storage = useStorage('kv')
    const storedConfig = await storage.getItem<Record<string, any>>('admin:social:provider-config') || {}
    const nextConfig = { ...storedConfig }
    if (nextConfig[platform]) {
      const tokenKey = platform === 'facebook' ? 'pageAccessToken' : 'accessToken'
      nextConfig[platform] = { ...nextConfig[platform] as Record<string, unknown>, [tokenKey]: newToken }
    }
    await storage.setItem('admin:social:provider-config', nextConfig)
  } catch {
    console.warn(`[social-autopost] Failed to save refreshed ${platform} token to KV`)
  }
}

const PLATFORM_MAX_LENGTHS: Record<SocialAutopostPlatform, number> = {
  instagram: 2200,
  facebook: 5000,
  threads: 500,
  x: 280,
  bluesky: 300,
  pinterest: 500,
}

function injectDescriptionIntoText(text: string, description: string, platform: SocialAutopostPlatform): string {
  const maxLength = PLATFORM_MAX_LENGTHS[platform] || 300
  const cleanDescription = description.replace(/\n{3,}/g, '\n\n').trim()

  const firstNewline = text.indexOf('\n')
  if (firstNewline === -1) {
    const result = `${text}\n\n${cleanDescription}`
    return result.length <= maxLength ? result : text
  }

  const titleLine = text.slice(0, firstNewline)
  const rest = text.slice(firstNewline)
  const result = `${titleLine}\n\n${cleanDescription}${rest}`
  if (result.length <= maxLength) return result

  const available = maxLength - titleLine.length - rest.length - 3
  if (available <= 10) return text
  const truncated = cleanDescription.slice(0, available - 1) + '…'
  return `${titleLine}\n\n${truncated}${rest}`
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isSocialAutopostPlatform(value: unknown): value is SocialAutopostPlatform {
  return typeof value === 'string' && SOCIAL_AUTOPOST_PLATFORMS.includes(value as SocialAutopostPlatform)
}

export function getSocialAutopostPlatformError(): string {
  return `platform must be one of: ${SOCIAL_AUTOPOST_PLATFORMS.join(', ')}`
}
