// GET /api/collections

import { db } from 'hub:db'
import { sql, eq, or, count } from 'drizzle-orm'
import type { DbCountResult, DbCollectionWithExtras, DbImageSimple } from '#shared/types/database'
import { collections, users, images, collectionImages } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = session.user?.id

  const query = getQuery(event)
  const limit = Number(query.limit) || 50
  const offset = Number(query.offset) || 0
  const includePrivate = Boolean(query.includePrivate) && userId
  
  try {
    // Build where condition based on user authentication
    let whereCondition
    if (userId && includePrivate) {
      whereCondition = or(
        eq(collections.isPublic, true),
        eq(collections.userId, userId)
      )
    } else {
      whereCondition = eq(collections.isPublic, true)
    }
    
    // Get total count for pagination
    const countResult = await db.select({ total: count() })
      .from(collections)
      .where(whereCondition)
      .get() as { total: number } | undefined
    
    const total = countResult?.total || 0
    
    // Fetch collections with owner info
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
    
    // For each collection, fetch the cover image if it exists
    const collectionsData = await Promise.all(collectionsResult.map(async (collection) => {
      let coverImage = null
      
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
      // If no cover image is set but collection has images, try to get the first image
      if (!coverImage && imageCount > 0) {
        const firstImageResult = await db.select({
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
          .limit(1)
          .get()
        
        if (firstImageResult) {
          coverImage = firstImageResult
          
          // Update the collection's cover_image_id if we found an image
          await db.update(collections)
            .set({ coverImageId: firstImageResult.id })
            .where(eq(collections.id, collection.id))
        }
      }
      
      return {
        ...collection,
        cover_image: coverImage,
        is_owner: userId === collection.ownerId,
        is_public: collection.isPublic === true,
      }
    }))
    
    return {
      success: true,
      collections: collectionsData,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
    
  } catch (error) {
    console.error('Error fetching collections:', error)
    
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch collections'
    })
  }
})
