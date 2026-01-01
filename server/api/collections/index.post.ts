// POST /api/collections

import { db } from '~/server/utils/database'
import { z } from 'zod'
import { sql } from 'drizzle-orm'

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
      const collectionResult = await db.get(sql`
        INSERT INTO collections (
          name, 
          description, 
          is_public, 
          slug, 
          user_id,
          cover_image_id
        )
        VALUES (
          ${validatedData.name},
          ${validatedData.description},
          ${validatedData.is_public ? 1 : 0},
          ${slug},
          ${user.id},
          ${validatedData.cover_image_id || null}
        )
        RETURNING id, name, description, is_public, slug, created_at
      `)
      
      if (!collectionResult) {
        throw new Error('Failed to create collection')
      }
      
      const collectionId = collectionResult.id
      
      // Prepare batch operations
      const batchOperations = []
      
      // 2. Add images to the collection if provided
      if (validatedData.image_ids && validatedData.image_ids.length > 0) {
        // Verify all images exist
        const imageIdsStr = validatedData.image_ids.join(',')
        const existingImagesResult = await db.all(sql.raw(`
          SELECT id FROM images 
          WHERE id IN (${imageIdsStr})
        `))
        
        const existingImageIds = existingImagesResult.map((img: any) => img.id as number)
        
        // Add each image to the collection with incremental position
        existingImageIds.forEach((imageId: number, i: number) => {
          batchOperations.push(
            db.run(sql`
              INSERT INTO collection_images (collection_id, image_id, position)
              VALUES (${collectionId}, ${imageId}, ${i})
            `)
          )
        })
        
        // If no cover image was specified but images were added, use the first image as cover
        if (!validatedData.cover_image_id && existingImageIds.length > 0) {
          batchOperations.push(
            db.run(sql`
              UPDATE collections
              SET cover_image_id = ${existingImageIds[0]}
              WHERE id = ${collectionId}
            `)
          )
        }
      }
      
      // Execute all operations in a batch (transaction)
      if (batchOperations.length > 0) {
        await db.batch(batchOperations)
      }
      
      // Fetch the complete collection with image count
      const finalCollection = await db.get(sql`
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM collection_images WHERE collection_id = c.id) as image_count
        FROM collections c
        WHERE c.id = ${collectionId}
      `)
      
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
