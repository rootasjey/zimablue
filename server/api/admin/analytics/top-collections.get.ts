// GET /api/admin/analytics/top-collections
// Returns top performing collections by views, likes, or downloads

import { db } from 'hub:db'
import { desc } from 'drizzle-orm'
import { collections } from '~~/server/db/schema'

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
  const limit = Math.min(Math.max(Number.parseInt((query.limit as string) || '5', 10) || 5, 1), 20)

  try {
    const orderByColumn = metric === 'likes'
      ? desc(collections.statsLikes)
      : metric === 'downloads'
        ? desc(collections.statsDownloads)
        : desc(collections.statsViews)

    const result = await db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        stats_views: collections.statsViews,
        stats_likes: collections.statsLikes,
        stats_downloads: collections.statsDownloads,
        created_at: collections.createdAt,
      })
      .from(collections)
      .orderBy(orderByColumn)
      .limit(limit)

    return {
      success: true,
      data: result || []
    }
  } catch (error) {
    console.error('Error fetching top collections:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch top collections'
    })
  }
})

