// GET /api/admin/collections

import { db } from 'hub:db'
import { sql } from 'drizzle-orm'
import type { Collection } from "~~/shared/types/collection"

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

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20
  const search = query.search as string || ''
  const isPublic = query.isPublic as string
  const userId = query.userId as string
  const offset = (page - 1) * limit

  try {
    let whereClause = ''

    // Build WHERE clause for filtering
    const conditions: string[] = []
    
    if (userId) {
      conditions.push(`c.user_id = ${userId}`)
    }

    if (isPublic !== undefined) {
      conditions.push(`c.is_public = ${isPublic === 'true' ? 1 : 0}`)
    }

    if (search) {
      const escapedSearch = search.replace(/'/g, "''")
      conditions.push(`(c.name LIKE '%${escapedSearch}%' OR c.description LIKE '%${escapedSearch}%')`)
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ')
    }

    // Get total count for pagination
    const countQuery = sql.raw(`
      SELECT COUNT(*) as total 
      FROM collections c
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause}
    `)
    const countResult = await db.get(countQuery) as { total: number } | undefined
    const total = countResult?.total || 0

    // Get collections with pagination and user info
    const collectionsQuery = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.slug,
        c.is_public,
        c.cover_image_id,
        c.stats_views,
        c.stats_downloads,
        c.stats_likes,
        c.created_at,
        c.updated_at,
        c.user_id,
        u.name as user_name,
        u.email as user_email,
        (SELECT COUNT(*) FROM collection_images ci WHERE ci.collection_id = c.id) as image_count
      FROM collections c
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    
    const collections = await db
      .all(sql.raw(collectionsQuery)) as unknown as (Collection & { user_name: string; user_email: string })[]

    return {
      success: true,
      data: {
        collections: collections,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    }
  } catch (error) {
    console.error('Error fetching collections:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch collections'
    })
  }
})
