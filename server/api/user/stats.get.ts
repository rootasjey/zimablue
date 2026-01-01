// GET /api/user/stats

import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'

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
    // Get total images count
    const totalImagesResult: { count: number } | null = await db.get(sql`
      SELECT COUNT(*) as count FROM images WHERE user_id = ${session.user.id}
    `)
    
    // Get total collections count (if you have collections)
    const totalCollectionsResult: { count: number } | null = await db.get(sql`
      SELECT COUNT(*) as count FROM collections WHERE user_id = ${session.user.id}
    `)
    
    // Get recent uploads (last 7 days)
    const recentUploadsResult: { count: number } | null = await db.get(sql`
      SELECT COUNT(*) as count FROM images WHERE user_id = ${session.user.id} AND created_at >= datetime("now", "-7 days")
    `)

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