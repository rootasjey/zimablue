// GET /api/admin/analytics/user-growth
// Returns user growth metrics (this month vs last month)

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

  try {
    const result = await db
      .get(sql`
        SELECT 
          COUNT(CASE WHEN created_at >= date('now', 'start of month') THEN 1 END) as this_month,
          COUNT(CASE WHEN created_at >= date('now', '-1 month', 'start of month') 
                     AND created_at < date('now', 'start of month') THEN 1 END) as last_month,
          COUNT(*) as total
        FROM users
      `)

    const thisMonth = (result as any)?.this_month || 0
    const lastMonth = (result as any)?.last_month || 0
    const total = (result as any)?.total || 0

    // Calculate percentage change
    let percentageChange = 0
    if (lastMonth > 0) {
      percentageChange = ((thisMonth - lastMonth) / lastMonth) * 100
    } else if (thisMonth > 0) {
      percentageChange = 100
    }

    return {
      success: true,
      data: {
        this_month: thisMonth,
        last_month: lastMonth,
        total,
        percentage_change: Math.round(percentageChange * 10) / 10 // Round to 1 decimal
      }
    }
  } catch (error) {
    console.error('Error fetching user growth:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch user growth'
    })
  }
})

