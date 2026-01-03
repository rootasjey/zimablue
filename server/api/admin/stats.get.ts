// GET /api/admin/stats

import { db } from 'hub:db'
import { sql, count, sum, eq, gte } from 'drizzle-orm'
import type { AdminStats } from "~~/shared/types/admin"
import { users, images, collections, messages } from '../../db/schema'

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
    // Get user stats
    const userStats = await db.select({
      total: count(),
      admins: sum(sql<number>`CASE WHEN ${users.role} = 'admin' THEN 1 ELSE 0 END`),
      newThisMonth: sum(sql<number>`CASE WHEN ${users.createdAt} >= date('now', '-30 days') THEN 1 ELSE 0 END`)
    })
      .from(users)
      .get() as { total: number; admins: number; newThisMonth: number } | undefined

    // Get image stats
    const imageStats = await db.select({
      total: count(),
      totalViews: sum(images.statsViews),
      totalDownloads: sum(images.statsDownloads),
      totalLikes: sum(images.statsLikes)
    })
      .from(images)
      .get() as { total: number; totalViews: number; totalDownloads: number; totalLikes: number } | undefined

    // Get collection stats
    const collectionStats = await db.select({
      total: count(),
      public: sum(sql<number>`CASE WHEN ${collections.isPublic} = 1 THEN 1 ELSE 0 END`),
      private: sum(sql<number>`CASE WHEN ${collections.isPublic} = 0 THEN 1 ELSE 0 END`),
      totalViews: sum(collections.statsViews)
    })
      .from(collections)
      .get() as { total: number; public: number; private: number; totalViews: number } | undefined

    // Get message stats
    const messageStats = await db.select({
      total: count(),
      unread: sum(sql<number>`CASE WHEN ${messages.read} = 0 THEN 1 ELSE 0 END`),
      newToday: sum(sql<number>`CASE WHEN ${messages.createdAt} >= date('now') THEN 1 ELSE 0 END`)
    })
      .from(messages)
      .get() as { total: number; unread: number; newToday: number } | undefined

    const stats: AdminStats = {
      users: {
        total: userStats?.total || 0,
        active: userStats?.total || 0, // Assuming all users are active for now
        admins: userStats?.admins || 0,
        newThisMonth: userStats?.newThisMonth || 0,
      },
      images: {
        total: imageStats?.total || 0,
        totalViews: imageStats?.totalViews || 0,
        totalDownloads: imageStats?.totalDownloads || 0,
        totalLikes: imageStats?.totalLikes || 0,
      },
      collections: {
        total: collectionStats?.total || 0,
        public: collectionStats?.public || 0,
        private: collectionStats?.private || 0,
        totalViews: collectionStats?.totalViews || 0,
      },
      messages: {
        total: messageStats?.total || 0,
        unread: messageStats?.unread || 0,
        newToday: messageStats?.newToday || 0,
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
