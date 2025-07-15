// GET /api/admin/images

import type { Image } from "~/types/image"

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
  const userId = query.userId as string
  const offset = (page - 1) * limit

  try {
    let whereClause = ''
    const params: any[] = []

    // Build WHERE clause for filtering
    const conditions: string[] = []
    
    if (userId) {
      conditions.push('i.user_id = ?')
      params.push(userId)
    }

    if (search) {
      conditions.push('(i.name LIKE ? OR i.description LIKE ? OR i.tags LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ')
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM images i
      LEFT JOIN users u ON i.user_id = u.id
      ${whereClause}
    `
    const countResult = await hubDatabase().prepare(countQuery).bind(...params).first()
    const total = countResult?.total as number || 0

    // Get images with pagination and user info
    const imagesQuery = `
      SELECT 
        i.id,
        i.name,
        i.description,
        i.pathname,
        i.slug,
        i.tags,
        i.variants,
        i.w,
        i.h,
        i.x,
        i.y,
        i.stats_views,
        i.stats_downloads,
        i.stats_likes,
        i.created_at,
        i.updated_at,
        i.user_id,
        u.name as user_name,
        u.email as user_email
      FROM images i
      LEFT JOIN users u ON i.user_id = u.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `
    
    const images = await hubDatabase()
      .prepare(imagesQuery)
      .bind(...params, limit, offset)
      .all()

    return {
      success: true,
      data: {
        images: images.results as unknown as (Image & { user_name: string; user_email: string })[],
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
    console.error('Error fetching images:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch images'
    })
  }
})
