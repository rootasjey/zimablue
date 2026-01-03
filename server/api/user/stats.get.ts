// GET /api/user/stats

import { db } from 'hub:db'
import { eq, sql, and, gte } from 'drizzle-orm'
import { images, collections } from '../../db/schema'

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
    const totalImagesResult = await db.select({ count: sql<number>`count(*)` })
      .from(images)
      .where(eq(images.userId, session.user.id))
      .get()
    
    // Get total collections count (if you have collections)
    const totalCollectionsResult = await db.select({ count: sql<number>`count(*)` })
      .from(collections)
      .where(eq(collections.userId, session.user.id))
      .get()
    
    // Get recent uploads (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentUploadsResult = await db.select({ count: sql<number>`count(*)` })
      .from(images)
      .where(and(
        eq(images.userId, session.user.id),
        gte(images.createdAt, sevenDaysAgo)
      ))
      .get()

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