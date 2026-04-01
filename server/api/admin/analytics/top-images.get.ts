// GET /api/admin/analytics/top-images
// Returns top performing images by views, likes, or downloads

import { db } from 'hub:db'
import { desc } from 'drizzle-orm'
import { images } from '~~/server/db/schema'

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
      ? desc(images.statsLikes)
      : metric === 'downloads'
        ? desc(images.statsDownloads)
        : desc(images.statsViews)

    const result = await db
      .select({
        id: images.id,
        name: images.name,
        slug: images.slug,
        stats_views: images.statsViews,
        stats_likes: images.statsLikes,
        stats_downloads: images.statsDownloads,
        created_at: images.createdAt,
      })
      .from(images)
      .orderBy(orderByColumn)
      .limit(limit)

    return {
      success: true,
      data: result || []
    }
  } catch (error) {
    console.error('Error fetching top images:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch top images'
    })
  }
})

