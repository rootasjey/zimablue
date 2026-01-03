// POST /api/collections

import { db } from 'hub:db'
import { z } from 'zod'
import { inArray, eq, sql as sqlCount } from 'drizzle-orm'
import type { DbCollection } from '#shared/types/database'
import { collections, images, collectionImages } from '../../db/schema'

const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  is_public: z.boolean().optional().default(true),
  image_ids: z.array(z.number()).optional().default([]),
  cover_image_id: z.number().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  if (!user.id) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to create a collection'
    })
  }
  
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  try {
    const body = await readBody(event)
    
    // Validate request body
    const validatedData = createCollectionSchema.parse(body)
    
    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
    
    try {
      // 1. Create the collection
      const collectionResult = await db.insert(collections)
        .values({
          name: validatedData.name,
          description: validatedData.description,
          isPublic: validatedData.is_public,
          slug: slug,
          userId: user.id,
          coverImageId: validatedData.cover_image_id || null
        })
        .returning({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          isPublic: collections.isPublic,
          slug: collections.slug,
          createdAt: collections.createdAt
        })
        .get() as Partial<DbCollection> | undefined
      
      if (!collectionResult) {
        throw new Error('Failed to create collection')
      }
      
      const collectionId = collectionResult.id
      
      // Prepare batch operations
      const batchOperations = []
      
      // 2. Add images to the collection if provided
      if (validatedData.image_ids && validatedData.image_ids.length > 0) {
        // Verify all images exist
        const existingImagesResult = await db.select({ id: images.id })
          .from(images)
          .where(inArray(images.id, validatedData.image_ids))
          .all()
        
        const existingImageIds = existingImagesResult.map(img => img.id)
        
        // Add each image to the collection with incremental position
        existingImageIds.forEach((imageId: number, i: number) => {
          batchOperations.push(
            db.insert(collectionImages)
              .values({
                collectionId: collectionId!,
                imageId: imageId,
                position: i
              })
          )
        })
        
        // If no cover image was specified but images were added, use the first image as cover
        if (!validatedData.cover_image_id && existingImageIds.length > 0) {
          batchOperations.push(
            db.update(collections)
              .set({ coverImageId: existingImageIds[0] })
              .where(eq(collections.id, collectionId!))
          )
        }
      }
      
      // Execute all operations in a batch (transaction)
      if (batchOperations.length > 0) {
        await db.batch(batchOperations as any)
      }
      
      // Fetch the complete collection with image count
      const finalCollection = await db.select()
        .from(collections)
        .where(eq(collections.id, collectionId!))
        .get() as (DbCollection & { image_count: number }) | undefined
      
      // Get image count separately
      const countResult = await db.select({ count: sqlCount<number>`count(*)` })
        .from(collectionImages)
        .where(eq(collectionImages.collectionId, collectionId!))
        .get()
      
      if (finalCollection) {
        (finalCollection as any).image_count = countResult?.count || 0
      }
      
      return {
        success: true,
        message: 'Collection created successfully',
        collection: {
          ...finalCollection,
          is_public: finalCollection?.is_public === 1,
        },
      }
      
    } catch (error) {
      throw error
    }
    
  } catch (error) {
    console.error('Error creating collection:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation error',
        data: error.issues
      })
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to create collection'
    })
  }
})
