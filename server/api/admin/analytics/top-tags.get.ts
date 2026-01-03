// GET /api/admin/analytics/top-tags
// Returns most used tags by usage_count

import { sql } from 'drizzle-orm'

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
  const limit = parseInt((query.limit as string) || '10')

  try {
    const tags = await db
      .all(sql`
        SELECT 
          id,
          name,
          slug,
          color,
          usage_count,
          created_at
        FROM tags
        ORDER BY usage_count DESC
        LIMIT ${limit}
      `)

    return {
      success: true,
      data: tags || []
    }
  } catch (error) {
    console.error('Error fetching top tags:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch top tags'
    })
  }
})

