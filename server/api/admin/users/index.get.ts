// GET /api/admin/users

import type { User } from "~/types/user"

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
  const roleFilter = query.role as string
  const search = query.search as string || ''
  const offset = (page - 1) * limit

  try {
    let whereClause = ''
    const params: any[] = []

    // Build WHERE clause for filtering
    const conditions: string[] = []
    
    if (roleFilter) {
      conditions.push('role = ?')
      params.push(roleFilter)
    }

    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ? OR job LIKE ? OR location LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ')
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`
    const countResult = await hubDatabase().prepare(countQuery).bind(...params).first()
    const total = countResult?.total as number || 0

    // Get users with pagination
    const usersQuery = `
      SELECT 
        id,
        name,
        email,
        role,
        biography,
        job,
        language,
        location,
        socials,
        created_at,
        updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    
    const users = await hubDatabase()
      .prepare(usersQuery)
      .bind(...params, limit, offset)
      .all()

    return {
      success: true,
      data: {
        users: users.results as unknown as User[],
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
    console.error('Error fetching users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch users'
    })
  }
})
