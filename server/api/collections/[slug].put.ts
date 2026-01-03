// PUT /api/collections/:slug

import { db } from 'hub:db'
import { z } from 'zod'
import { eq, max, sql } from 'drizzle-orm'
import type { ServerCollection } from '~~/shared/types/collection'
import { collections, collectionImages, images } from '../../db/schema'

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
      const collection = await db.select({ id: collections.id, userId: collections.userId })
        .from(collections)
        .where(eq(collections.slug, slug))
        .get()

      if (!collection) {
        throw createError({
          statusCode: 404,
          message: 'Collection not found'
        })
      }
      if (collection.userId !== user.id && user.role !== 'admin') {
        throw createError({
          statusCode: 403,
          message: 'You do not have permission to update this collection'
        })
      }

      const id = collection.id

      // Prepare update object
      const updateData: Partial<typeof collections.$inferInsert> = {}

      if (validatedData.name !== undefined) {
        updateData.name = validatedData.name
      }

      if (validatedData.description !== undefined) {
        updateData.description = validatedData.description
      }

      if (validatedData.cover_image_id !== undefined) {
        updateData.coverImageId = validatedData.cover_image_id
      }

      if (validatedData.slug !== undefined) {
        updateData.slug = validatedData.slug
      }

      if (validatedData.is_public !== undefined) {
        updateData.isPublic = validatedData.is_public
      }

      // Update collection metadata if there are changes
      if (Object.keys(updateData).length > 0) {
        await db.update(collections)
          .set({
            ...updateData,
            updatedAt: new Date()
          })
          .where(eq(collections.id, id))
      }

      // Handle image operations if provided
      if (validatedData.images) {
        // Remove images
        if (validatedData.images.remove && validatedData.images.remove.length > 0) {
          for (const imageId of validatedData.images.remove) {
            await db.delete(collectionImages)
              .where(eq(collectionImages.collectionId, id))
              .where(eq(collectionImages.imageId, imageId))
          }
        }
        
        // Add new images
        if (validatedData.images.add && validatedData.images.add.length > 0) {
          // Get the current highest position
          const positionResult = await db.select({ maxPosition: max(collectionImages.position) })
            .from(collectionImages)
            .where(eq(collectionImages.collectionId, id))
            .get()
          
          const maxPosition = positionResult?.maxPosition ?? -1
          let nextPosition = maxPosition + 1
          
          // Add each new image
          for (const imageId of validatedData.images.add) {
            // Check if image exists
            const imageExists = await db.select({ id: images.id })
              .from(images)
              .where(eq(images.id, imageId))
              .get()
            
            if (imageExists) {
              // Check if this image is already in the collection
              const existingRelation = await db.select({ imageId: collectionImages.imageId })
                .from(collectionImages)
                .where(eq(collectionImages.collectionId, id))
                .where(eq(collectionImages.imageId, imageId))
                .get()
              
              if (!existingRelation) {
                // Add the image to the collection
                await db.insert(collectionImages)
                  .values({
                    collectionId: id,
                    imageId: imageId,
                    position: nextPosition
                  })
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
            await db.update(collectionImages)
              .set({ position: i })
              .where(eq(collectionImages.collectionId, id))
              .where(eq(collectionImages.imageId, newOrder[i]))
          }
        }
      }
      
      // Fetch the updated collection with image count
      const updatedCollection = await db.select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        slug: collections.slug,
        isPublic: collections.isPublic,
        coverImageId: collections.coverImageId,
        statsViews: collections.statsViews,
        statsLikes: collections.statsLikes,
        statsDownloads: collections.statsDownloads,
        userId: collections.userId,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        imageCount: sql<number>`(SELECT COUNT(*) FROM collection_images WHERE collection_id = ${collections.id})`
      })
        .from(collections)
        .where(eq(collections.id, id))
        .get()
      
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
