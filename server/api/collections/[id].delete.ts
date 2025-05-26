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
  
  if (!user || !user.id) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to delete a collection'
    })
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
    
    // Check if user owns the collection or is an admin
    const collection = existingCollections[0]
    if (collection.user_id !== user.id && user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this collection'
      })
    }
    
    // Count how many images were in the collection for the response
    const { results: imageCountResult } = await db.prepare(`
      SELECT COUNT(*) as count FROM collection_images WHERE collection_id = ?
    `)
    .bind(id)
    .run()
    
    const imageCount = imageCountResult[0]?.count || 0
    
    // Prepare batch operations
    const batchOperations = []
    
    // Delete the collection 
    // (this will cascade to collection_images if you have foreign key constraints)
    const deleteCollectionStmt = db.prepare(`
      DELETE FROM collections
      WHERE id = ?
    `)
    .bind(id)
    
    batchOperations.push(deleteCollectionStmt)
    
    // If you don't have CASCADE constraints, 
    // you might need to explicitly delete the collection_images
    const deleteImagesStmt = db.prepare(`
      DELETE FROM collection_images
      WHERE collection_id = ?
    `)
    .bind(id)
    
    batchOperations.push(deleteImagesStmt)
    
    // Execute all operations in a batch
    await db.batch(batchOperations)

    return {
      success: true,
      message: 'Collection deleted successfully',
      data: {
        id: Number(id),
        imagesRemoved: imageCount
      }
    }
  } catch (error: any) {
    console.error(`Error deleting collection ${id}:`, error)

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
