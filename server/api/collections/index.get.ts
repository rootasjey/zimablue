import { db } from 'hub:db'
import { sql, eq, or, count } from 'drizzle-orm'
import type { DbCollectionWithExtras, DbImageSimple } from '#shared/types/database'
import { collections, users, images, collectionImages } from '../../db/schema'
import { keysToSnake } from '../../utils/case'
import { computePagination } from '../../utils/api-response'
import { getOptionalApiUser } from '../../utils/api-auth'

export default defineEventHandler(async (event) => {
  const user = await getOptionalApiUser(event)
  const userId = user?.id

  const query = getQuery(event)
  const limit = Number(query.limit) || 50
  const offset = Number(query.offset) || 0
  const includePrivate = Boolean(query.includePrivate) && !!userId

  let whereCondition
  if (userId && includePrivate) {
    whereCondition = or(
      eq(collections.isPublic, true),
      eq(collections.userId, userId)
    )
  } else {
    whereCondition = eq(collections.isPublic, true)
  }

  const countResult = await db.select({ total: count() })
    .from(collections)
    .where(whereCondition)
    .get() as { total: number } | undefined

  const total = countResult?.total || 0

  const collectionsResult = await db.select({
    id: collections.id,
    name: collections.name,
    description: collections.description,
    slug: collections.slug,
    isPublic: collections.isPublic,
    coverImageId: collections.coverImageId,
    statsViews: collections.statsViews,
    statsLikes: collections.statsLikes,
    createdAt: collections.createdAt,
    updatedAt: collections.updatedAt,
    ownerId: users.id,
    ownerName: users.name,
    imageCount: sql<number>`(SELECT COUNT(*) FROM collection_images WHERE collection_id = ${collections.id})`
  })
    .from(collections)
    .leftJoin(users, eq(collections.userId, users.id))
    .where(whereCondition)
    .orderBy(sql`${collections.createdAt} DESC`)
    .limit(limit)
    .offset(offset)
    .all()

  const collectionsData = await Promise.all(collectionsResult.map(async (collection) => {
    let coverImage = null
    let previewImages = []

    const collectionImagesResult = await db.select({
      id: images.id,
      name: images.name,
      pathname: images.pathname,
      w: images.w,
      h: images.h
    })
      .from(images)
      .innerJoin(collectionImages, eq(images.id, collectionImages.imageId))
      .where(eq(collectionImages.collectionId, collection.id))
      .orderBy(collectionImages.position)
      .limit(4)
      .all()

    previewImages = collectionImagesResult.map(img => keysToSnake(img))

    if (collection.coverImageId) {
      const coverImageResult = await db.select({
        id: images.id,
        name: images.name,
        pathname: images.pathname,
        w: images.w,
        h: images.h
      })
        .from(images)
        .where(eq(images.id, collection.coverImageId))
        .get()

      if (coverImageResult) {
        coverImage = coverImageResult
      }
    }

    const imageCount = collection.imageCount
    if (!coverImage && imageCount > 0 && previewImages.length > 0) {
      coverImage = previewImages[0]
      await db.update(collections)
        .set({ coverImageId: coverImage.id })
        .where(eq(collections.id, collection.id))
    }

    const collectionSnake = keysToSnake(collection)
    const coverImageSnake = coverImage ? keysToSnake(coverImage) : null

    return {
      ...collectionSnake,
      cover_image: coverImageSnake,
      preview_images: previewImages,
      is_owner: userId === collection.ownerId,
      is_public: collection.isPublic === true,
    }
  }))

  return {
    success: true,
    data: collectionsData,
    pagination: computePagination(total, limit, offset),
  }
})
