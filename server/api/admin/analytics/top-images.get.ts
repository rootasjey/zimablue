// GET /api/admin/analytics/top-images
// Returns top performing images by views, likes, or downloads

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
  const metric = (query.metric as string) || 'views' // views, likes, downloads
  const limit = parseInt((query.limit as string) || '5')

  try {
    const db = hubDatabase()

    const orderByColumn = metric === 'likes' ? 'stats_likes' 
      : metric === 'downloads' ? 'stats_downloads' 
      : 'stats_views'

    const images = await db
      .prepare(`
        SELECT 
          id,
          name,
          slug,
          stats_views,
          stats_likes,
          stats_downloads,
          created_at
        FROM images
        ORDER BY ${orderByColumn} DESC
        LIMIT ?
      `)
      .bind(limit)
      .all()

    return {
      success: true,
      data: images.results || []
    }
  } catch (error) {
    console.error('Error fetching top images:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch top images'
    })
  }
})

