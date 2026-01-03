import { db } from 'hub:db'
import { z } from 'zod'
import type { VariantType } from '~~/shared/types/image'
import { eq, and, inArray } from 'drizzle-orm'
import { blob } from 'hub:blob'
import { kv } from 'hub:kv'
import type { DbImage } from '#shared/types/database'
import { images } from '../../db/schema'

const bulkDeleteSchema = z.object({
  imageIds: z.array(z.number()).min(1, 'At least one image ID is required').max(50, 'Cannot delete more than 50 images at once')
})

export default eventHandler(async (event) => {
  // Require authentication
  const session = await requireUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }
  
  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

  // Validate request body
  const body = await readBody(event)
  const { imageIds } = await bulkDeleteSchema.parseAsync(body)

  if (!imageIds || imageIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No image IDs provided'
    })
  }

  const userId = session.user.id
  const deletedImages: any[] = []
  const failedDeletes: { id: number, error: string }[] = []

  try {
    // Get all images that exist and belong to the user
    const existingImages = await db.select({
        id: images.id,
        pathname: images.pathname,
        variants: images.variants,
        user_id: images.userId
      })
      .from(images)
      .where(and(
        inArray(images.id, imageIds),
        eq(images.userId, userId)
      ))
      .all() as Pick<DbImage, 'id' | 'pathname' | 'variants' | 'user_id'>[]
    
    if (existingImages.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No images found or you do not have permission to delete these images'
      })
    }

    // Process each image deletion
    for (const image of existingImages) {
      try {
        // Parse variants to get all file paths
        let variants: Array<VariantType> = []
        try {
          variants = JSON.parse(image.variants || '[]')
        } catch (parseError) {
          console.warn(`Failed to parse variants for image ${image.id}:`, parseError)
        }

        // Delete from database first
        await db.delete(images)
          .where(and(
            eq(images.id, image.id),
            eq(images.userId, userId)
          ))

        deletedImages.push({
          id: image.id,
          pathname: image.pathname
        })

        // Delete blob files (don't fail the whole operation if blob deletion fails)
        for (const variant of variants) {
          try {
            if (variant.pathname) {
              await blob.del(variant.pathname)
            }
          } catch (blobError) {
            console.warn(`Failed to delete blob ${variant.pathname} for image ${image.id}:`, blobError)
            // Continue with other variants
          }
        }
      } catch (error) {
        console.error(`Error deleting image ${image.id}:`, error)
        failedDeletes.push({
          id: image.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Check for images that weren't found or don't belong to user
    const foundImageIds = existingImages.map((img: any) => img.id)
    const notFoundIds = imageIds.filter(id => !foundImageIds.includes(id))
    
    notFoundIds.forEach(id => {
      failedDeletes.push({
        id,
        error: 'Image not found or access denied'
      })
    })

    // Update grid layout in KV store (remove deleted images)
    if (deletedImages.length > 0) {
      try {
        const layout = (await kv.get('grid:main') ?? []) as any[]
        const deletedImageIds = deletedImages.map(img => img.id)
        const updatedLayout = layout.filter(item => !deletedImageIds.includes(item.id))
        await kv.set('grid:main', updatedLayout)
      } catch (kvError) {
        console.warn('Failed to update grid layout in KV store:', kvError)
        // Don't fail the whole operation if KV update fails
      }
    }

    // Return results
    const successCount = deletedImages.length
    const failureCount = failedDeletes.length

    if (successCount === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No images could be deleted'
      })
    }

    return {
      success: true,
      message: `Successfully deleted ${successCount} image${successCount > 1 ? 's' : ''}${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      deleted: deletedImages,
      failed: failedDeletes,
      counts: {
        requested: imageIds.length,
        successful: successCount,
        failed: failureCount
      }
    }

  } catch (error) {
    console.error('Bulk delete operation failed:', error)
    
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Bulk delete operation failed'
    })
  }
})
