import { db, schema } from 'hub:db'
import { asc, desc, eq, like, or, sql } from 'drizzle-orm'
import { isAdminSession } from '../../../utils/auth'
import { getSocialAutopostPlatformError, isSocialAutopostPlatform } from '../../../utils/social-autopost'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const query = getQuery(event)
  const platform = String(query.platform || 'bluesky').trim()

  if (!isSocialAutopostPlatform(platform)) {
    throw createError({ statusCode: 400, statusMessage: getSocialAutopostPlatformError() })
  }

  const search = String(query.search || '').trim()
  const limit = Math.min(Math.max(parseInt(String(query.limit || '150'), 10) || 150, 1), 1000)
  const searchPattern = `%${search}%`

  const postCountExpr = sql<number>`(
    SELECT COUNT(1)
    FROM social_posts sp
    WHERE sp.image_id = ${schema.images.id}
      AND sp.platform = ${platform}
      AND sp.status = 'success'
  )`

  const searchCondition = search
    ? or(
      like(schema.images.name, searchPattern),
      like(schema.images.description, searchPattern),
      like(schema.images.slug, searchPattern),
      sql<boolean>`EXISTS (
        SELECT 1
        FROM image_tags it
        JOIN tags t ON t.id = it.tag_id
        WHERE it.image_id = ${schema.images.id}
          AND (t.name LIKE ${searchPattern} OR t.slug LIKE ${searchPattern})
      )`
    )
    : undefined

  const baseQuery = db.select({
    id: schema.images.id,
    name: schema.images.name,
    description: schema.images.description,
    pathname: schema.images.pathname,
    slug: schema.images.slug,
    w: schema.images.w,
    h: schema.images.h,
    statsViews: schema.images.statsViews,
    statsDownloads: schema.images.statsDownloads,
    statsLikes: schema.images.statsLikes,
    userId: schema.images.userId,
    userName: schema.users.name,
    createdAt: schema.images.createdAt,
    postCount: postCountExpr.as('post_count'),
  })
    .from(schema.images)
    .leftJoin(schema.users, eq(schema.images.userId, schema.users.id))

  const rows = await (searchCondition
    ? baseQuery.where(searchCondition).orderBy(asc(postCountExpr), desc(schema.images.createdAt)).limit(limit).all()
    : baseQuery.orderBy(asc(postCountExpr), desc(schema.images.createdAt)).limit(limit).all())

  return {
    success: true,
    data: rows,
    total: rows.length,
  }
})