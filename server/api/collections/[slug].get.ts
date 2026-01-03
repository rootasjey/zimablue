// GET /api/collections/:slug

import { db } from 'hub:db'
import type { Image } from '~~/shared/types/image'
import { eq, sql as sqlOp } from 'drizzle-orm'
import type { DbCollection } from '~~/shared/types/database'
import { collections, images, collectionImages, users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  
  if (typeof slug !== 'string' || slug.length === 0) {
    throw createError({
      statusCode: 400,
      message: `Invalid collection slug ${slug}`,
    })
  }

  try {
    // Fetch the collection
    const collection = await db.select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        coverImageId: collections.coverImageId,
        slug: collections.slug,
        isPublic: collections.isPublic,
        statsViews: collections.statsViews,
        statsLikes: collections.statsLikes,
        statsDownloads: collections.statsDownloads,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        userId: collections.userId
      })
      .from(collections)
      .where(eq(collections.slug, slug))
      .get() as any | undefined

    if (!collection) {
      throw createError({
        statusCode: 404,
        message: 'Collection not found'
      })
    }
    const id = collection.id

    // Increment the views counter
    await db.update(collections)
      .set({ statsViews: sqlOp`${collections.statsViews} + 1` })
      .where(eq(collections.id, id))

    // Fetch the associated images with their position in the collection
    const imagesResult = await db.select({
      id: images.id,
      name: images.name,
      description: images.description,
      pathname: images.pathname,
      slug: images.slug,
      w: images.w,
      h: images.h,
      x: images.x,
      y: images.y,
      sum: images.sum,
      sumAbs: images.sumAbs,
      statsViews: images.statsViews,
      statsDownloads: images.statsDownloads,
      statsLikes: images.statsLikes,
      variants: images.variants,
      userId: images.userId,
      createdAt: images.createdAt,
      updatedAt: images.updatedAt,
      position: collectionImages.position
    })
      .from(images)
      .innerJoin(collectionImages, eq(images.id, collectionImages.imageId))
      .where(eq(collectionImages.collectionId, id))
      .orderBy(collectionImages.position)
      .all()

    // Parse JSON fields in images and attach position
    const parsedImages = imagesResult.map((image: any) => ({
      ...image,
      position: image.position,
      tags: typeof image.tags === 'string' ? JSON.parse(image.tags || '[]') : image.tags,
      variants: typeof image.variants === 'string' ? JSON.parse(image.variants || '[]') : image.variants
    }))

    // Get the owner information
    const ownerResponse = await db.select({
        id: users.id,
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, collection.userId))
      .get() as { id: number; name: string; email?: string } | undefined

    const owner: { id: number; name: string; email?: string } = ownerResponse || { id: collection.userId, name: 'Unknown' }
    
    // Remove sensitive information
    if (owner.email) {
      delete owner.email
    }

    return {
      success: true,
      collection: {
        ...collection,
        image_count: parsedImages.length,
        is_public: collection.isPublic === true,
        owner,
      },
      images: parsedImages
    }
  } catch (error: unknown) {
    console.error(`Error fetching collection ${slug}:`, error)
    
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch collection'
    })
  }
})
