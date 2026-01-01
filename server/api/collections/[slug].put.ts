// PUT /api/collections/:slug

import { db } from '~/server/utils/database'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import type { ServerCollection } from '~/types/collection'

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
  const slug = getRouterParam(event, 'slug')

  if (typeof slug !== 'string' || slug.length === 0) {
    throw createError({
      statusCode: 400,
      message: `Invalid collection slug ${slug}`,
    })
  }
  
  const session = await requireUserSession(event)
  const user = session.user as any

  if (!user || user.id == null) {
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
    
    try {
      // Check if collection exists and belongs to the user
      const collection = await db.get(sql`
        SELECT id, user_id FROM collections WHERE slug = ${slug}
      `) as any

      if (!collection) {
        throw createError({
          statusCode: 404,
          message: 'Collection not found'
        })
      }
      if (collection.user_id !== user.id && user.role !== 'admin') {
        throw createError({
          statusCode: 403,
          message: 'You do not have permission to update this collection'
        })
      }

      const id = collection.id as number

      // Prepare batch operations array
      const batchOperations = [] as any[]

      // Build the update query dynamically based on provided fields
      const updates: string[] = []
      const params: any[] = []

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
        
        const updateQueryString = `
          UPDATE collections
          SET ${updates.join(', ')}
          WHERE id = ?
        `
        
        params.push(id)
        const updateQuery = sql.raw(updateQueryString)
        
        batchOperations.push(
          (db as any).run(updateQuery, params)
        )
      }

      // Handle image operations if provided
      if (validatedData.images) {
        // Remove images
        if (validatedData.images.remove && validatedData.images.remove.length > 0) {
          const imageIdsToRemove = validatedData.images.remove
          
          for (const imageId of imageIdsToRemove) {
            batchOperations.push(
              db.run(sql`
                DELETE FROM collection_images
                WHERE collection_id = ${id} AND image_id = ${imageId}
              `)
            )
          }
        }
        
        // Add new images
        if (validatedData.images.add && validatedData.images.add.length > 0) {
          // Get the current highest position
          const positionResult = await db.get(sql`
            SELECT COALESCE(MAX(position), -1) as max_position
            FROM collection_images
            WHERE collection_id = ${id}
          `)
          
          const positionRow = positionResult as any
          const max_position = (positionRow?.max_position as number) ?? -1
          let nextPosition = max_position + 1
          
          // Add each new image
          for (const imageId of validatedData.images.add) {
            // Check if image exists
            const imageExists = await db.get(sql`
              SELECT id FROM images WHERE id = ${imageId}
            `)
            
            if (imageExists) {
              // Check if this image is already in the collection
              const existingRelation = await db.get(sql`
                SELECT 1 FROM collection_images
                WHERE collection_id = ${id} AND image_id = ${imageId}
              `)
              
              if (!existingRelation) {
                // Add the image to the collection
                batchOperations.push(
                  db.run(sql`
                    INSERT INTO collection_images (collection_id, image_id, position)
                    VALUES (${id}, ${imageId}, ${nextPosition})
                  `)
                )
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
            batchOperations.push(
              db.run(sql`
                UPDATE collection_images
                SET position = ${i}
                WHERE collection_id = ${id} AND image_id = ${newOrder[i]}
              `)
            )
          }
        }
      }
      
      // Execute all operations in a batch if there are any
      if (batchOperations.length > 0) {
        await (db as any).batch(batchOperations)
      }
      
      // Fetch the updated collection with image count
      const updatedCollection: ServerCollection | null = await db.get(sql`
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM collection_images WHERE collection_id = c.id) as image_count
        FROM collections c
        WHERE c.id = ${id}
      `)
      
      return {
        success: true,
        message: 'Collection updated successfully',
        collection: {
          ...updatedCollection,
          is_public: updatedCollection?.is_public === 1,
        }
      }
      
    } catch (error) {
      throw error
    }
  } catch (error: any) {
    console.error(`Error updating collection ${slug}:`, error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation error',
        data: error.issues
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
