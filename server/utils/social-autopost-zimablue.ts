import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import type {
  SocialAutopostPlatform,
  SocialContentPayload,
  SocialMediaAsset,
  SocialPublishableSourceResolver,
  SocialResolvedPublishableSource,
  SocialSourceRef,
} from '@verbatims/social-autopost-core'

export interface ZimablueQueueSourceRef {
  sourceType: string
  sourceId: number
  imageId: number
}

export interface ZimablueResolvedImageContent {
  content: SocialContentPayload
  media: SocialMediaAsset
}

export const zimablueSocialPublishableSourceResolver: SocialPublishableSourceResolver = {
  async resolveSource(input: SocialSourceRef & {
    baseSiteUrl: string
    platform: SocialAutopostPlatform
  }): Promise<SocialResolvedPublishableSource | null> {
    if (input.sourceType !== 'image') {
      return null
    }

    const imageId = Number(input.sourceId)
    if (!Number.isFinite(imageId)) {
      return null
    }

    const image = await db.select({
      id: schema.images.id,
      name: schema.images.name,
      description: schema.images.description,
      pathname: schema.images.pathname,
      slug: schema.images.slug,
      userName: schema.users.name,
    })
      .from(schema.images)
      .leftJoin(schema.users, eq(schema.images.userId, schema.users.id))
      .where(eq(schema.images.id, imageId))
      .limit(1)
      .get()

    if (!image) {
      return null
    }

    const tagRows = await db.select({
      name: schema.tags.name,
    })
      .from(schema.imageTags)
      .innerJoin(schema.tags, eq(schema.imageTags.tagId, schema.tags.id))
      .where(eq(schema.imageTags.imageId, image.id))

    return resolveZimablueImageContent({
      image: {
        id: image.id,
        name: image.name,
        description: image.description,
        pathname: image.pathname,
        slug: image.slug,
        userName: image.userName,
        tags: tagRows.map(tag => tag.name),
      },
      baseSiteUrl: input.baseSiteUrl,
      platform: input.platform,
    })
  }
}

export async function resolveZimablueSourceContent(input: ZimablueQueueSourceRef & {
  baseSiteUrl: string
  platform: SocialAutopostPlatform
}): Promise<ZimablueResolvedImageContent | null> {
  return zimablueSocialPublishableSourceResolver.resolveSource(input) as Promise<ZimablueResolvedImageContent | null>
}

export function getZimablueFallbackCanonicalUrl(input: ZimablueQueueSourceRef & { baseSiteUrl: string }): string {
  if (input.sourceType === 'image') {
    return `${input.baseSiteUrl}/illustrations/${input.sourceId}`
  }

  return input.baseSiteUrl
}

function resolveZimablueImageContent(input: {
  image: {
    id: number
    name: string
    description: string | null
    pathname: string
    slug: string
    userName: string | null
    tags: string[]
  }
  baseSiteUrl: string
  platform: SocialAutopostPlatform
}): ZimablueResolvedImageContent | null {
  const imagePath = normalizeMediaPath(input.image.pathname)
  if (!imagePath) {
    return null
  }

  const canonicalUrl = `${input.baseSiteUrl}/illustrations/${input.image.slug}`
  const primaryText = input.image.name.trim()
  const description = input.image.description?.trim() || undefined
  const attribution = input.image.userName ? `— ${input.image.userName}` : undefined

  return {
    content: {
      sourceType: 'image',
      sourceId: input.image.id,
      primaryText,
      title: input.image.name,
      description,
      attribution,
      canonicalUrl,
      hashtags: input.image.tags,
      metadata: {
        imageId: input.image.id,
        slug: input.image.slug,
        platform: input.platform,
      }
    },
    media: {
      url: `${input.baseSiteUrl}${imagePath}`,
      alt: description || primaryText,
    }
  }
}

function normalizeMediaPath(pathname: string | null | undefined): string | null {
  const normalized = String(pathname || '').trim()
  if (!normalized) {
    return null
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`
}