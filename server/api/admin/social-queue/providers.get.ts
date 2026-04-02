import { isAdminSession } from '../../../utils/auth'
import { resolveFacebookPostConfig, resolveInstagramPostConfig, resolveThreadsPostConfig } from '../../../utils/social-meta-config'
import { hasStoredSocialProviderConfig } from '../../../utils/social-provider-settings'
import { getXAuthConfig } from '../../../utils/social-x-auth'
import { resolveBlueskyProviderConfig, resolveFacebookEnabledConfig, resolveInstagramEnabledConfig, resolveThreadsEnabledConfig, resolveXProviderConfig } from '../../../utils/social-provider-config'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const resolvedX = await resolveXProviderConfig()
  const resolvedXAuth = getXAuthConfig({
    oauth2AccessToken: resolvedX.oauth2AccessToken,
    oauth1ConsumerKey: resolvedX.oauth1ConsumerKey,
    oauth1ConsumerSecret: resolvedX.oauth1ConsumerSecret,
    oauth1AccessToken: resolvedX.oauth1AccessToken,
    oauth1AccessTokenSecret: resolvedX.oauth1AccessTokenSecret,
  })
  const bluesky = await resolveBlueskyProviderConfig()
  const instagram = await resolveInstagramPostConfig()
  const threads = await resolveThreadsPostConfig()
  const facebook = await resolveFacebookPostConfig()
  const [xStored, blueskyStored, instagramStored, threadsStored, facebookStored] = await Promise.all([
    hasStoredSocialProviderConfig('x'),
    hasStoredSocialProviderConfig('bluesky'),
    hasStoredSocialProviderConfig('instagram'),
    hasStoredSocialProviderConfig('threads'),
    hasStoredSocialProviderConfig('facebook'),
  ])

  return {
    success: true,
    data: [
      {
        platform: 'x',
        enabled: resolvedX.enabled,
        configured: resolvedXAuth.mode !== 'none',
        label: 'X',
        detail: resolvedXAuth.mode === 'none' ? 'Missing OAuth credentials' : `Using ${resolvedXAuth.mode === 'oauth1' ? 'OAuth 1.0a' : 'OAuth 2.0 user'} auth`,
        storage: xStored ? 'kv' : 'runtime',
      },
      {
        platform: 'bluesky',
        enabled: bluesky.enabled,
        configured: Boolean(bluesky.identifier && bluesky.password),
        label: 'Bluesky',
        detail: bluesky.identifier ? `Account ${bluesky.identifier}` : 'Missing identifier or password',
        storage: blueskyStored ? 'kv' : 'runtime',
      },
      {
        platform: 'instagram',
        enabled: (await resolveInstagramEnabledConfig()).enabled,
        configured: Boolean(instagram.accessToken && instagram.userId),
        label: 'Instagram',
        detail: instagram.userId ? `Business account ${instagram.userId}` : 'Missing access token or account id',
        storage: instagramStored ? 'kv' : 'runtime',
      },
      {
        platform: 'threads',
        enabled: (await resolveThreadsEnabledConfig()).enabled,
        configured: Boolean(threads.accessToken && threads.userId),
        label: 'Threads',
        detail: threads.userId ? `User ${threads.userId}` : 'Missing access token or user id',
        storage: threadsStored ? 'kv' : 'runtime',
      },
      {
        platform: 'facebook',
        enabled: (await resolveFacebookEnabledConfig()).enabled,
        configured: Boolean(facebook.pageAccessToken && facebook.pageId),
        label: 'Facebook',
        detail: facebook.pageId ? `Page ${facebook.pageId}` : 'Missing page token or page id',
        storage: facebookStored ? 'kv' : 'runtime',
      }
    ]
  }
})
