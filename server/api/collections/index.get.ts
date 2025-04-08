export default defineEventHandler(async (event) => {
  const db = hubDatabase()
  
  try {
    const queryResponse = await db.prepare(`
      SELECT id, name, description, items, cover_image_id, slug, is_public, stats_views, created_at, updated_at
      FROM collections
      ORDER BY created_at DESC
    `)
    .run()

    if (!queryResponse.success) {
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch collections from database'
      })
    }

    // Parse the items JSON string to an array for each collection
    const parsedCollections = queryResponse.results.map(collection => ({
      ...collection,
      items: JSON.parse((collection.items as string) || '[]')
    }))

    return {
      success: true,
      collections: parsedCollections
    }
  } catch (error) {
    console.error('Error fetching collections:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch collections'
    })
  }
})
