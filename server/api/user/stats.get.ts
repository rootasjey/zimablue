// GET /api/user/stats

export default eventHandler(async (event) => {
  // Get user session (you'll need to implement this based on your auth system)
  const session = await getUserSession(event)
  
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  try {
    const db = await hubDatabase()
    
    // Get total images count
    const totalImagesResult: { count: number } | null = await db
      .prepare('SELECT COUNT(*) as count FROM images WHERE user_id = ?')
      .bind(session.user.id)
      .first()
    
    // Get total collections count (if you have collections)
    const totalCollectionsResult: { count: number } | null = await db
      .prepare('SELECT COUNT(*) as count FROM collections WHERE user_id = ?')
      .bind(session.user.id)
      .first()
    
    // Get recent uploads (last 7 days)
    const recentUploadsResult: { count: number } | null = await db
      .prepare('SELECT COUNT(*) as count FROM images WHERE user_id = ? AND created_at >= datetime("now", "-7 days")')
      .bind(session.user.id)
      .first()

    return {
      data: {
        totalImages: totalImagesResult?.count || 0,
        totalCollections: totalCollectionsResult?.count || 0,
        recentUploads: recentUploadsResult?.count || 0,
      },
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch user statistics'
    })
  }
})