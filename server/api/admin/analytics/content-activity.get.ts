// GET /api/admin/analytics/content-activity
// Returns content creation activity (images uploaded in last 7/30 days)

import { sql } from 'drizzle-orm'
import { isAdminSession } from '~/server/utils/auth'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  if (!isAdminSession(session)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

  try {
    const result = await db
      .get(sql`
        SELECT 
          COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as last_7_days,
          COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as last_30_days,
          COUNT(*) as total
        FROM images
      `)

    return {
      success: true,
      data: {
        last_7_days: (result as any)?.last_7_days || 0,
        last_30_days: (result as any)?.last_30_days || 0,
        total: (result as any)?.total || 0
      }
    }
  } catch (error) {
    console.error('Error fetching content activity:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch content activity'
    })
  }
})

