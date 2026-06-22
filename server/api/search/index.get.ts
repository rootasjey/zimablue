import { db } from 'hub:db'
import { like, or, eq, sql, and, desc, inArray } from 'drizzle-orm'
import type { ImageWithTags } from "~~/shared/types/image"
import type { Collection } from "~~/shared/types/collection"
import { images, collections, users, tags, imageTags, collectionImages } from '../../db/schema'
import { keysToSnake } from '../../utils/case'
import { apiSuccess } from '../../utils/api-response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchTerm = (query.q as string) || ''
  const limit = Math.min(parseInt(query.limit as string) || 10, 50)
  const includeImages = query.images !== 'false'
  const includeCollections = query.collections !== 'false'

  if (!searchTerm.trim()) {
    return apiSuccess({ images: [], collections: [], total: { images: 0, collections: 0 } })
  }

  const searchPattern = `%${searchTerm}%`

  let imagesResult: ImageWithTags[] = []
  let collectionsResult: Collection[] = []
  let totalImages = 0
  let totalCollections = 0

  if (includeImages) {
    const imageResults = await db.select()
      .from(images)
      .where(or(
        like(images.name, searchPattern),
        like(images.description, searchPattern)
      ))
      .orderBy(desc(images.statsViews), desc(images.createdAt))
      .limit(limit)
      .all()

    totalImages = imageResults.length
    const imageIds = imageResults.map(img => img.id)

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
        .orderBy(tags.name)
        .all()

      const tagsByImage = new Map<number, any[]>()
      for (const tagRow of tagsResult) {
        if (!tagsByImage.has(tagRow.imageId)) {
          tagsByImage.set(tagRow.imageId, [])
        }
        tagsByImage.get(tagRow.imageId)!.push({
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

      imagesResult = imageResults.map(img => keysToSnake({
        ...(img as any),
        tags: tagsByImage.get(img.id) || []
      })) as unknown as ImageWithTags[]
    }
  }

  if (includeCollections) {
    const collectionResults = await db.select({
        collection: collections,
        user: users,
        imageCount: sql<number>`(SELECT COUNT(*) FROM ${collectionImages} WHERE ${collectionImages.collectionId} = ${collections.id})`,
        coverImagePathname: sql<string | null>`(SELECT ${images.pathname} FROM ${images} WHERE ${images.id} = ${collections.coverImageId})`
      })
      .from(collections)
      .leftJoin(users, eq(collections.userId, users.id))
      .where(and(
        eq(collections.isPublic, true),
        or(
          like(collections.name, searchPattern),
          like(collections.description, searchPattern)
        )
      ))
      .orderBy(desc(collections.statsViews), desc(collections.createdAt))
      .limit(limit)
      .all()

    totalCollections = collectionResults.length

    collectionsResult = collectionResults.map((row: any) => ({
      ...keysToSnake(row.collection),
      owner_name: row.user?.name || 'Unknown',
      cover_image_pathname: row.coverImagePathname,
      image_count: row.imageCount,
      is_public: Boolean(row.collection.isPublic),
      owner: {
        id: row.collection.userId,
        name: row.user?.name || 'Unknown'
      }
    })) as unknown as Collection[]
  }

  return apiSuccess({
    images: imagesResult,
    collections: collectionsResult,
    total: {
      images: totalImages,
      collections: totalCollections
    }
  })
})
