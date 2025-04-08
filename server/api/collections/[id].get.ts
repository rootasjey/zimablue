import { z } from 'zod'

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
      SELECT id, name, description, items, cover_image_id, slug, is_public, stats_views, created_at, updated_at
      FROM collections
      WHERE id = ?
    `)
    .bind(id)
    .run()

    if (!queryResponse.success) {
      throw createError({
        statusCode: 404,
        message: 'Collection not found'
      })
    }

    // Parse the items JSON string to an array
    const collection = {
      ...queryResponse.results[0],
      items: JSON.parse((queryResponse.results[0].items as string) || '[]')
    }

    // If the collection has items, fetch the associated images
    let images: Record<string, unknown>[] = []
    if (collection.items.length > 0) {
      const queryImageResponse = await db.prepare(`
        SELECT id, name, pathname, description, w, h, x, y, tags, stats_likes, stats_views, stats_downloads
        FROM images
        WHERE id IN (${collection.items.join(',')})
      `)
      .run()

      if (!queryImageResponse.success) {
        throw createError({
          statusCode: 500,
          message: 'Failed to fetch images from database'
        })
      }

      images = queryImageResponse.results
    }

    return {
      success: true,
      collection,
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
