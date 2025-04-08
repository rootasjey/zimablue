export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid collection ID'
    })
  }
  
  const db = hubDatabase()
  
  try {
    // Check if collection exists
    const { results: existingCollections } = await db.prepare(`
      SELECT id FROM collections WHERE id = ?
    `)
    .bind(id)
    .run()

    if (!existingCollections.length) {
      throw createError({
        statusCode: 404,
        message: 'Collection not found'
      })
    }
    
    // Delete the collection
    await db.prepare(`
      DELETE FROM collections
      WHERE id = ?
    `)
    .bind(id)
    .run()

    return {
      success: true,
      message: 'Collection deleted successfully'
    }
  } catch (error) {
    console.error(`Error deleting collection ${id}:`, error)

    throw createError({
      statusCode: 500,
      message: 'Failed to delete collection'
    })
  }
})
