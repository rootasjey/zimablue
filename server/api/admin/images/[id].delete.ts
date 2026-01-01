// DELETE /api/admin/images/[id]

import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'

export default eventHandler(async (event) => {
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

  const imageId = getRouterParam(event, 'id')
  if (!imageId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Image ID is required'
    })
  }

  try {
    // Check if image exists
    const existingImage = await db.get(sql`SELECT id, pathname FROM images WHERE id = ${imageId}`)
    if (!existingImage) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Image not found'
      })
    }

    // Delete image from database (this will cascade to related data due to foreign key constraints)
    await db.run(sql`DELETE FROM images WHERE id = ${imageId}`)

    // TODO: Also delete the actual image files from storage
    // This would depend on your storage implementation (hubBlob, etc.)

    return {
      success: true,
      message: 'Image deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete image'
    })
  }
})
