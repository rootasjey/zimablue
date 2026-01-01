// GET /api/admin/stats

import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'
import type { AdminStats } from "~/types/admin"
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
    // Get user stats
    const userStats = await db.get(sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN created_at >= date('now', '-30 days') THEN 1 ELSE 0 END) as newThisMonth
      FROM users
    `)

    // Get image stats
    const imageStats = await db.get(sql`
      SELECT 
        COUNT(*) as total,
        SUM(stats_views) as totalViews,
        SUM(stats_downloads) as totalDownloads,
        SUM(stats_likes) as totalLikes
      FROM images
    `)

    // Get collection stats
    const collectionStats = await db.get(sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as public,
        SUM(CASE WHEN is_public = 0 THEN 1 ELSE 0 END) as private,
        SUM(stats_views) as totalViews
      FROM collections
    `)

    // Get message stats
    const messageStats = await db.get(sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN read = 0 THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN created_at >= date('now') THEN 1 ELSE 0 END) as newToday
      FROM messages
    `)

    const stats: AdminStats = {
      users: {
        total: userStats?.total as number || 0,
        active: userStats?.total as number || 0, // Assuming all users are active for now
        admins: userStats?.admins as number || 0,
        newThisMonth: userStats?.newThisMonth as number || 0,
      },
      images: {
        total: imageStats?.total as number || 0,
        totalViews: imageStats?.totalViews as number || 0,
        totalDownloads: imageStats?.totalDownloads as number || 0,
        totalLikes: imageStats?.totalLikes as number || 0,
      },
      collections: {
        total: collectionStats?.total as number || 0,
        public: collectionStats?.public as number || 0,
        private: collectionStats?.private as number || 0,
        totalViews: collectionStats?.totalViews as number || 0,
      },
      messages: {
        total: messageStats?.total as number || 0,
        unread: messageStats?.unread as number || 0,
        newToday: messageStats?.newToday as number || 0,
      }
    }

    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch admin stats'
    })
  }
})
