import { Image } from '~/types/image'

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
    // Increment the views counter
    await db.prepare(`
      UPDATE collections
      SET stats_views = stats_views + 1
      WHERE id = ?
    `)
    .bind(id)
    .run()

    // Fetch the collection
    const queryResponse = await db.prepare(`
      SELECT id, name, description, cover_image_id, slug, is_public, stats_views, 
             stats_likes, stats_downloads, created_at, updated_at, user_id
      FROM collections
      WHERE id = ?
    `)
    .bind(id)
    .run()

    if (!queryResponse.success || queryResponse.results.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Collection not found'
      })
    }

    const collection = queryResponse.results[0]

    // Fetch the associated images with their position in the collection
    const queryImagesResponse = await db.prepare(`
      SELECT i.*, ci.position
      FROM images i
      JOIN collection_images ci ON i.id = ci.image_id
      WHERE ci.collection_id = ?
      ORDER BY ci.position ASC
    `)
    .bind(id)
    .run()

    let images: Array<Image & { position: number }> = []
    if (queryImagesResponse.success) {
      images = queryImagesResponse.results as unknown as Array<Image & { position: number }>
      
      // Parse JSON fields in images
      images = images.map(image => ({
        ...image,
        tags: JSON.parse(image.tags || '[]'),
        variants: JSON.parse(image.variants || '[]')
      }))
    }

    // Get the owner information
    const ownerResponse = await db.prepare(`
      SELECT id, name, email
      FROM users
      WHERE id = ?
    `)
    .bind(collection.user_id)
    .first()

    const owner = ownerResponse || { id: collection.user_id, name: 'Unknown' }
    
    // Remove sensitive information
    if (owner) {
      delete owner.email
    }

    return {
      success: true,
      collection: {
        ...collection,
        image_count: images.length,
        owner
      },
      images
    }
  } catch (error: unknown) {
    console.error(`Error fetching collection ${id}:`, error)
    
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch collection'
    })
  }
})
