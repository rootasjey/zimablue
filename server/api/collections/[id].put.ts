import { z } from 'zod'

const updateCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  cover_image_id: z.number().optional().nullable(),
  slug: z.string().optional(),
  is_public: z.boolean().optional(),
  // New field for image operations
  images: z.object({
    add: z.array(z.number()).optional(),
    remove: z.array(z.number()).optional(),
    reorder: z.array(z.number()).optional()
  }).optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid collection ID'
    })
  }
  
  const session = await requireUserSession(event)
  const user = session.user

  if (!user.id) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to update a collection'
    })
  }

  const body = await readBody(event)

  try {
    const validatedData = updateCollectionSchema.parse(body)

    // Generate slug if name is provided but slug is not
    if (validatedData.name && !validatedData.slug) {
      validatedData.slug = validatedData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
    }

    const db = hubDatabase()
    
    try {
      // Check if collection exists and belongs to the user
      const { results: existingCollections } = await db.prepare(`
        SELECT id, user_id FROM collections WHERE id = ?
      `)
      .bind(id)
      .run()

      if (!existingCollections.length) {
        throw createError({
          statusCode: 404,
          message: 'Collection not found'
        })
      }
      
      const collection = existingCollections[0]
      if (collection.user_id !== user.id && user.role !== 'admin') {
        throw createError({
          statusCode: 403,
          message: 'You do not have permission to update this collection'
        })
      }

      // Prepare batch operations array
      const batchOperations = []

      // Build the update query dynamically based on provided fields
      const updates = []
      const params = []

      if (validatedData.name !== undefined) {
        updates.push('name = ?')
        params.push(validatedData.name)
      }

      if (validatedData.description !== undefined) {
        updates.push('description = ?')
        params.push(validatedData.description)
      }

      if (validatedData.cover_image_id !== undefined) {
        updates.push('cover_image_id = ?')
        params.push(validatedData.cover_image_id)
      }

      if (validatedData.slug !== undefined) {
        updates.push('slug = ?')
        params.push(validatedData.slug)
      }

      if (validatedData.is_public !== undefined) {
        updates.push('is_public = ?')
        params.push(validatedData.is_public ? 1 : 0)
      }

      // Update collection metadata if there are changes
      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP')
        
        const updateQuery = `
          UPDATE collections
          SET ${updates.join(', ')}
          WHERE id = ?
        `
        
        params.push(id)
        
        const updateStmt = db.prepare(updateQuery).bind(...params)
        batchOperations.push(updateStmt)
      }

      // Handle image operations if provided
      if (validatedData.images) {
        // Remove images
        if (validatedData.images.remove && validatedData.images.remove.length > 0) {
          const imageIdsToRemove = validatedData.images.remove
          
          for (const imageId of imageIdsToRemove) {
            const removeStmt = db
            .prepare(`
              DELETE FROM collection_images
              WHERE collection_id = ? AND image_id = ?
            `)
            .bind(id, imageId)
            
            batchOperations.push(removeStmt)
          }
        }
        
        // Add new images
        if (validatedData.images.add && validatedData.images.add.length > 0) {
          // Get the current highest position
          const { results: positionResult } = await db
          .prepare(`
            SELECT COALESCE(MAX(position), -1) as max_position
            FROM collection_images
            WHERE collection_id = ?
          `)
          .bind(id)
          .run()
          
          const max_position = positionResult[0] ? (positionResult[0]?.max_position as number) : -1
          let nextPosition = max_position + 1
          
          // Add each new image
          for (const imageId of validatedData.images.add) {
            // Check if image exists
            const { results: imageExists } = await db
            .prepare(`
              SELECT id FROM images WHERE id = ?
            `)
            .bind(imageId)
            .run()
            
            if (imageExists.length > 0) {
              // Check if this image is already in the collection
              const { results: existingRelation } = await db
              .prepare(`
                SELECT 1 FROM collection_images
                WHERE collection_id = ? AND image_id = ?
              `)
              .bind(id, imageId)
              .run()
              
              if (existingRelation.length === 0) {
                // Add the image to the collection
                const addImageStmt = db
                .prepare(`
                  INSERT INTO collection_images (collection_id, image_id, position)
                  VALUES (?, ?, ?)
                `)
                .bind(id, imageId, nextPosition)
                
                batchOperations.push(addImageStmt)
                nextPosition++
              }
            }
          }
        }
        
        // Reorder images
        if (validatedData.images.reorder && validatedData.images.reorder.length > 0) {
          const newOrder = validatedData.images.reorder
          
          // Update positions based on the new order
          for (let i = 0; i < newOrder.length; i++) {
            const reorderStmt = db
            .prepare(`
              UPDATE collection_images
              SET position = ?
              WHERE collection_id = ? AND image_id = ?
            `)
            .bind(i, id, newOrder[i])
            
            batchOperations.push(reorderStmt)
          }
        }
      }
      
      // Execute all operations in a batch if there are any
      if (batchOperations.length > 0) {
        await db.batch(batchOperations)
      }
      
      // Fetch the updated collection with image count
      const updatedCollection = await db
      .prepare(`
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM collection_images WHERE collection_id = c.id) as image_count
        FROM collections c
        WHERE c.id = ?
      `)
      .bind(id)
      .first()
      
      return {
        success: true,
        message: 'Collection updated successfully',
        collection: updatedCollection
      }
      
    } catch (error) {
      throw error
    }
  } catch (error: any) {
    console.error(`Error updating collection ${id}:`, error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation error',
        data: error.errors
      })
    }

    if (error.statusCode) {
      // Pass through custom errors
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to update collection'
    })
  }
})
