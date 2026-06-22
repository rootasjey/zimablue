import { db } from 'hub:db'
import type { ImageWithTags } from "~~/shared/types/image"
import { inArray, eq, asc, count } from 'drizzle-orm'
import { images, tags, imageTags } from '../../db/schema'
import { keysToSnake } from '../../utils/case'
import { computePagination } from '../../utils/api-response'

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const limit = query.limit ? Number(query.limit) : undefined
  const offset = query.offset ? Number(query.offset) : 0
  const hasPagination = limit !== undefined

  if (hasPagination) {
    // Paginated mode — used by external apps (mobile/desktop)
    // Get total count
    const countResult = await db.select({ total: count() })
      .from(images)
      .get() as { total: number } | undefined
    const total = countResult?.total || 0

    // Get paginated images
    const imagesResponse = await db.select({
        id: images.id,
        name: images.name,
        description: images.description,
        pathname: images.pathname,
        slug: images.slug,
        variants: images.variants,
        w: images.w,
        h: images.h,
        x: images.x,
        y: images.y,
        statsViews: images.statsViews,
        statsDownloads: images.statsDownloads,
        statsLikes: images.statsLikes,
        createdAt: images.createdAt,
        updatedAt: images.updatedAt,
        userId: images.userId
      })
      .from(images)
      .orderBy(asc(images.sumAbs))
      .limit(limit!)
      .offset(offset)
      .all()

    const imageIds = imagesResponse.map(img => img.id)
    const imageTagsMap = await fetchTagsForImages(imageIds)
    const imagesWithTags = imagesResponse.map(img => ({
      ...img,
      tags: imageTagsMap.get(img.id) || []
    })) as unknown as ImageWithTags[]

    return {
      success: true,
      data: imagesWithTags.map(keysToSnake),
      pagination: computePagination(total, limit!, offset)
    }
  }

  // Legacy mode — returns raw array (backward compat for web frontend)
  const imagesResponse = await db.select({
      id: images.id,
      name: images.name,
      description: images.description,
      pathname: images.pathname,
      slug: images.slug,
      variants: images.variants,
      w: images.w,
      h: images.h,
      x: images.x,
      y: images.y,
      statsViews: images.statsViews,
      statsDownloads: images.statsDownloads,
      statsLikes: images.statsLikes,
      createdAt: images.createdAt,
      updatedAt: images.updatedAt,
      userId: images.userId
    })
    .from(images)
    .orderBy(asc(images.sumAbs))
    .all()

  const imageIds = imagesResponse.map(img => img.id)
  const imageTagsMap = await fetchTagsForImages(imageIds)
  const imagesWithTags = imagesResponse.map(img => ({
    ...img,
    tags: imageTagsMap.get(img.id) || []
  })) as unknown as ImageWithTags[]

  return imagesWithTags.map(keysToSnake)
})

async function fetchTagsForImages(imageIds: number[]): Promise<Map<number, any[]>> {
  const imageTagsMap = new Map<number, any[]>()
  if (imageIds.length === 0) return imageTagsMap

  const tagsResult = await db.select({
      imageId: imageTags.imageId,
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
    .where(inArray(imageTags.imageId, imageIds))
    .orderBy(asc(tags.name))
    .all()

  for (const tagRow of tagsResult) {
    if (!imageTagsMap.has(tagRow.imageId)) {
      imageTagsMap.set(tagRow.imageId, [])
    }
    imageTagsMap.get(tagRow.imageId)!.push({
      id: tagRow.id,
      name: tagRow.name,
      slug: tagRow.slug,
      description: tagRow.description,
      color: tagRow.color,
      usage_count: tagRow.usageCount,
      created_at: tagRow.createdAt,
      updated_at: tagRow.updatedAt
    })
  }

  return imageTagsMap
}
