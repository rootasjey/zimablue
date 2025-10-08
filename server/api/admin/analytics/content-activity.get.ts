// GET /api/admin/analytics/content-activity
// Returns content creation activity (images uploaded in last 7/30 days)

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
    const db = hubDatabase()

    const result = await db
      .prepare(`
        SELECT 
          COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as last_7_days,
          COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as last_30_days,
          COUNT(*) as total
        FROM images
      `)
      .first()

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

