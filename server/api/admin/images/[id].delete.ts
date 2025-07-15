// DELETE /api/admin/images/[id]

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
    const db = hubDatabase()

    // Check if image exists
    const existingImage = await db.prepare('SELECT id, pathname FROM images WHERE id = ?').bind(imageId).first()
    if (!existingImage) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Image not found'
      })
    }

    // Delete image from database (this will cascade to related data due to foreign key constraints)
    await db.prepare('DELETE FROM images WHERE id = ?').bind(imageId).run()

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
