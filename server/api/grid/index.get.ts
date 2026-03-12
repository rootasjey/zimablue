import type { Image } from "~~/shared/types/image"
import { db } from 'hub:db'
import { images, tags, imageTags } from '../../db/schema'
import { asc, eq } from 'drizzle-orm'
import { toISOString } from '../../utils/date'

export default eventHandler(async (event) => {
  // The home grid is mutated frequently (drag, resize, upload, delete), so it must
  // always be fetched fresh to avoid stale edge/browser responses after edits.
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate')

  // Fetch all images with their tags in a single query to avoid N+1 problem
  const rows = await db.select({
    // Image fields
    id: images.id,
    i: images.i,
    x: images.x,
    y: images.y,
    w: images.w,
    h: images.h,
    sum: images.sum,
    sumAbs: images.sumAbs,
    pathname: images.pathname,
    slug: images.slug,
    name: images.name,
    description: images.description,
    variants: images.variants,
    statsViews: images.statsViews,
    statsDownloads: images.statsDownloads,
    statsLikes: images.statsLikes,
    userId: images.userId,
    createdAt: images.createdAt,
    updatedAt: images.updatedAt,
    // Tag fields (will be null for images without tags)
    tagId: tags.id,
    tagName: tags.name,
    tagSlug: tags.slug,
    tagDescription: tags.description,
    tagColor: tags.color,
    tagUsageCount: tags.usageCount,
    tagCreatedAt: tags.createdAt,
    tagUpdatedAt: tags.updatedAt
  })
    .from(images)
    .leftJoin(imageTags, eq(imageTags.imageId, images.id))
    .leftJoin(tags, eq(imageTags.tagId, tags.id))
    .orderBy(asc(images.sumAbs), asc(tags.name))

  // Group tags by image
  const imageMap = new Map<number, any>()
  for (const row of rows) {
    const imageId = row.id
    if (!imageMap.has(imageId)) {
      // Initialize image entry with default values for computed fields
      imageMap.set(imageId, {
        id: imageId,
        i: row.i ?? imageId,
        x: row.x,
        y: row.y,
        w: row.w,
        h: row.h,
        sum: row.sum ?? (row.x + row.y),
        sum_abs: row.sumAbs ?? (Math.abs(row.x) + Math.abs(row.y)),
        pathname: row.pathname,
        slug: row.slug,
        name: row.name,
        description: row.description ?? '',
        variants: row.variants ?? '[]',
        stats_views: row.statsViews,
        stats_downloads: row.statsDownloads,
        stats_likes: row.statsLikes,
        user_id: row.userId,
        created_at: toISOString(row.createdAt),
        updated_at: toISOString(row.updatedAt),
        tags: [] as any[]
      })
    }
    // If this row has a tag (left join may produce null tags for images without tags)
    if (row.tagId) {
      const tag = imageMap.get(imageId).tags
      tag.push({
        id: row.tagId,
        name: row.tagName,
        slug: row.tagSlug,
        description: row.tagDescription ?? '',
        color: row.tagColor ?? '#3B82F6',
        usage_count: row.tagUsageCount,
        created_at: toISOString(row.tagCreatedAt),
        updated_at: toISOString(row.tagUpdatedAt)
      })
    }
  }

  // Convert map to array and sort by sum_abs to match original order (though already ordered by query)
  const imagesWithTags = Array.from(imageMap.values()).sort((a, b) => a.sum_abs - b.sum_abs)

  return imagesWithTags as Image[]
})
