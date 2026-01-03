// DELETE /api/collections/:slug

import { db } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import type { DbCollectionRow } from '~~/shared/types/database'
import { collections, collectionImages } from '../../db/schema'
import { sql as sqlCount } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  
  if (typeof slug !== 'string' || slug.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid collection ID'
    })
  }

  const session = await requireUserSession(event)
  const user = session.user
  
  if (!user || !user.id) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to delete a collection'
    })
  }
  
  try {
    // Check if collection exists and belongs to the user
    const collection = await db.select({
        id: collections.id,
        user_id: collections.userId,
        name: collections.name
      })
      .from(collections)
      .where(eq(collections.slug, slug))
      .get() as DbCollectionRow | undefined

    if (!collection) {
      throw createError({
        statusCode: 404,
        message: 'Collection not found'
      })
    }
    
    // Check if user owns the collection or is an admin
    const id = collection.id
    if (collection.user_id !== user.id && user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this collection'
      })
    }
    
    // Count how many images were in the collection for the response
    const imageCountResult = await db.select({ count: sqlCount<number>`count(*)` })
      .from(collectionImages)
      .where(eq(collectionImages.collectionId, id))
      .get() as { count: number } | undefined
    
    const imageCount = imageCountResult?.count || 0
    
    // Execute all operations in a batch
    await db.batch([
      // Delete collection_images first
      db.delete(collectionImages)
        .where(eq(collectionImages.collectionId, id)),
      // Then delete the collection
      db.delete(collections)
        .where(eq(collections.id, id))
    ])

    return {
      success: true,
      message: 'Collection deleted successfully',
      collection: {
        id: Number(id),
        imagesRemoved: imageCount,
        name: collection.name,
      }
    }
  } catch (error: any) {
    console.error(`Error deleting collection ${slug}:`, error)

    if (error.statusCode) {
      // Pass through custom errors
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to delete collection'
    })
  }
})
