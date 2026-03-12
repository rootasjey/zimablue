import type { Image } from "~~/shared/types/image"
import { db } from 'hub:db'
import { images, tags, imageTags } from '../../db/schema'
import { asc, eq } from 'drizzle-orm'
import { toISOString } from '../../utils/date'

export default eventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')

  // Fetch all images with their tags from D1
  const imagesData = await db.select()
    .from(images)
    .orderBy(asc(images.sumAbs))
    .all()

  // Fetch tags for each image
  const imagesWithTags = await Promise.all(
    imagesData.map(async (image) => {
      const imageTagData = await db.select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        description: tags.description,
        color: tags.color,
        usageCount: tags.usageCount,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt
      })
        .from(imageTags)
        .innerJoin(tags, eq(imageTags.tagId, tags.id))
        .where(eq(imageTags.imageId, image.id))
        .orderBy(tags.name)
        .all()

      // Map tag data to snake_case for frontend compatibility
      const mappedTags = imageTagData.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description ?? '',
        color: tag.color ?? '#3B82F6',
        usage_count: tag.usageCount,
        created_at: toISOString(tag.createdAt),
        updated_at: toISOString(tag.updatedAt)
      }))

      return {
        ...image,
        // Map snake_case to camelCase for frontend compatibility
        id: image.id,
        i: image.i ?? image.id,
        x: image.x,
        y: image.y,
        w: image.w,
        h: image.h,
        sum: image.sum ?? image.x + image.y,
        sum_abs: image.sumAbs ?? Math.abs(image.x) + Math.abs(image.y),
        pathname: image.pathname,
        slug: image.slug,
        name: image.name,
        description: image.description ?? '',
        variants: image.variants ?? '[]',
        stats_views: image.statsViews,
        stats_downloads: image.statsDownloads,
        stats_likes: image.statsLikes,
        user_id: image.userId,
        created_at: toISOString(image.createdAt),
        updated_at: toISOString(image.updatedAt),
        tags: mappedTags
      }
    })
  )

  return imagesWithTags as Image[]
})
