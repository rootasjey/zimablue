// GET /api/collections

import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userId = session.user?.id

  const query = getQuery(event)
  const limit = Number(query.limit) || 50
  const offset = Number(query.offset) || 0
  const includePrivate = Boolean(query.includePrivate) && userId
  
  try {
    // Build the query based on user authentication
    let whereClause = 'WHERE is_public = 1'
    
    // If user is logged in and includePrivate is true, include their private collections
    if (userId && includePrivate) {
      whereClause = `WHERE (is_public = 1 OR user_id = ${userId})`
    }
    
    // Get total count for pagination
    const countResult = await db.get(sql.raw(`
      SELECT COUNT(*) as total
      FROM collections
      ${whereClause}
    `))
    
    const total = countResult?.total as number || 0
    
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
      LIMIT ${limit} OFFSET ${offset}
    `
    
    const collectionsResult = await db.all(sql.raw(collectionsQuery))
    
    // For each collection, fetch the cover image if it exists
    const collections = await Promise.all(collectionsResult.map(async (collection: any) => {
      let coverImage = null
      
      if (collection.cover_image_id) {
        const coverImageResult = await db.get(sql`
          SELECT id, name, pathname, w, h
          FROM images
          WHERE id = ${collection.cover_image_id}
        `)
        
        if (coverImageResult) {
          coverImage = coverImageResult
        }
      }
      
      const imageCount = collection.image_count as number
      // If no cover image is set but collection has images, try to get the first image
      if (!coverImage && imageCount > 0) {
        const firstImageResult = await db.get(sql`
          SELECT i.id, i.name, i.pathname, i.w, i.h
          FROM images i
          JOIN collection_images ci ON i.id = ci.image_id
          WHERE ci.collection_id = ${collection.id}
          ORDER BY ci.position ASC
          LIMIT 1
        `)
        
        if (firstImageResult) {
          coverImage = firstImageResult
          
          // Update the collection's cover_image_id if we found an image
          await db.run(sql`
            UPDATE collections
            SET cover_image_id = ${firstImageResult.id}
            WHERE id = ${collection.id}
          `)
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
