// DELETE /api/admin/collections/[id]

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

  const collectionId = getRouterParam(event, 'id')
  if (!collectionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Collection ID is required'
    })
  }

  try {
    // Check if collection exists
    const existingCollection = await db.get(sql`SELECT id FROM collections WHERE id = ${collectionId}`)
    if (!existingCollection) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Collection not found'
      })
    }

    // Delete collection (this will cascade to collection_images due to foreign key constraints)
    await db.run(sql`DELETE FROM collections WHERE id = ${collectionId}`)

    return {
      success: true,
      message: 'Collection deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting collection:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete collection'
    })
  }
})
