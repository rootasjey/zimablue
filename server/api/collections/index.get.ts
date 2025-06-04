// GET /api/collections

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id

  const query = getQuery(event)
  const limit = Number(query.limit) || 50
  const offset = Number(query.offset) || 0
  const includePrivate = Boolean(query.includePrivate) && userId
  
  try {
    const db = hubDatabase()
    
    // Build the query based on user authentication
    let whereClause = 'WHERE is_public = 1'
    
    // If user is logged in and includePrivate is true, include their private collections
    if (userId && includePrivate) {
      whereClause = `WHERE (is_public = 1 OR user_id = ${userId})`
    }
    
    // Get total count for pagination
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total
      FROM collections
      ${whereClause}
    `)
    .run()
    
    const total = countResult.results[0] 
      ? (countResult.results[0]?.total as number) 
      : 0
    
    // Fetch collections with image count and owner info
    const collectionsQuery = `
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.slug, 
        c.is_public, 
        c.cover_image_id,
        c.stats_views,
        c.stats_likes,
        c.created_at,
        c.updated_at,
        u.id as owner_id,
        u.name as owner_name,
        (SELECT COUNT(*) FROM collection_images WHERE collection_id = c.id) as image_count
      FROM collections c
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `
    
    const collectionsResult = await db.prepare(collectionsQuery)
      .bind(limit, offset)
      .run()
    
    if (!collectionsResult.success) {
      throw new Error('Failed to fetch collections')
    }
    
    // For each collection, fetch the cover image if it exists
    const collections = await Promise.all(collectionsResult.results.map(async (collection) => {
      let coverImage = null
      
      if (collection.cover_image_id) {
        const coverImageResult = await db.prepare(`
          SELECT id, name, pathname, w, h
          FROM images
          WHERE id = ?
        `)
        .bind(collection.cover_image_id)
        .first()
        
        if (coverImageResult) {
          coverImage = coverImageResult
        }
      }
      
      const imageCount = collection.image_count as number
      // If no cover image is set but collection has images, try to get the first image
      if (!coverImage && imageCount > 0) {
        const firstImageResult = await db.prepare(`
          SELECT i.id, i.name, i.pathname, i.w, i.h
          FROM images i
          JOIN collection_images ci ON i.id = ci.image_id
          WHERE ci.collection_id = ?
          ORDER BY ci.position ASC
          LIMIT 1
        `)
        .bind(collection.id)
        .first()
        
        if (firstImageResult) {
          coverImage = firstImageResult
          
          // Update the collection's cover_image_id if we found an image
          await db.prepare(`
            UPDATE collections
            SET cover_image_id = ?
            WHERE id = ?
          `)
          .bind(firstImageResult.id, collection.id)
          .run()
        }
      }
      
      return {
        ...collection,
        cover_image: coverImage,
        is_owner: userId === collection.owner_id,
        is_public: collection.is_public === 1,
      }
    }))
    
    return {
      success: true,
      collections,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
    
  } catch (error) {
    console.error('Error fetching collections:', error)
    
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch collections'
    })
  }
})
