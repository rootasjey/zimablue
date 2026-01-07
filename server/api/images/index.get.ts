import { db } from 'hub:db'
import type { ImageWithTags } from "~~/shared/types/image"
import { inArray, eq, asc } from 'drizzle-orm'
import { images, tags, imageTags } from '../../db/schema'
import { keysToSnake } from '../../utils/case'

export default eventHandler(async () => {
  // Get all images
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

  // Get tags for all images
  let imageTagsMap = new Map<number, any[]>()
  if (imageIds.length > 0) {
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

    // Group tags by image_id
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
  }

  // Combine images with their tags
  const imagesWithTags = imagesResponse.map(img => ({
    ...img,
    tags: imageTagsMap.get(img.id) || []
  })) as unknown as ImageWithTags[]

  return imagesWithTags.map(keysToSnake)
})
