import { db, schema } from 'hub:db'
import { and, asc, count, desc, eq, like, or, sql } from 'drizzle-orm'
import { isAdminSession } from '../../../utils/auth'
import { getSocialAutopostPlatformError, isSocialAutopostPlatform } from '../../../utils/social-autopost'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const query = getQuery(event)
  const page = Math.max(parseInt(String(query.page || '1'), 10) || 1, 1)
  const limit = Math.min(Math.max(parseInt(String(query.limit || '20'), 10) || 20, 1), 100)
  const offset = (page - 1) * limit
  const search = String(query.search || '').trim()
  const status = String(query.status || '').trim()
  const platform = String(query.platform || 'bluesky').trim()

  if (!isSocialAutopostPlatform(platform)) {
    throw createError({ statusCode: 400, statusMessage: getSocialAutopostPlatformError() })
  }

  const conditions = [eq(schema.socialQueue.platform, platform)]

  if (status) {
    if (!['queued', 'processing', 'posted', 'failed'].includes(status)) {
      throw createError({ statusCode: 400, statusMessage: 'status must be queued, processing, posted, or failed' })
    }

    conditions.push(eq(schema.socialQueue.status, status as 'queued' | 'processing' | 'posted' | 'failed'))
  }

  if (search) {
    conditions.push(or(
      like(schema.images.name, `%${search}%`),
      like(schema.images.description, `%${search}%`),
      like(schema.images.slug, `%${search}%`)
    )!)
  }

  const whereCondition = and(...conditions)

  const rows = await db.select({
    id: schema.socialQueue.id,
    imageId: schema.socialQueue.imageId,
    sourceType: schema.socialQueue.sourceType,
    sourceId: schema.socialQueue.sourceId,
    platform: schema.socialQueue.platform,
    status: schema.socialQueue.status,
    position: schema.socialQueue.position,
    scheduledFor: schema.socialQueue.scheduledFor,
    lastError: schema.socialQueue.lastError,
    createdAt: schema.socialQueue.createdAt,
    updatedAt: schema.socialQueue.updatedAt,
    imageName: schema.images.name,
    imageDescription: schema.images.description,
    imageSlug: schema.images.slug,
    imagePathname: schema.images.pathname,
    userName: schema.users.name,
    publishedPostUrl: sql<string | null>`(
      SELECT sp.post_url
      FROM social_posts sp
      WHERE sp.queue_id = ${schema.socialQueue.id}
      ORDER BY sp.created_at DESC, sp.id DESC
      LIMIT 1
    )`.as('published_post_url'),
    publishedExternalPostId: sql<string | null>`(
      SELECT sp.external_post_id
      FROM social_posts sp
      WHERE sp.queue_id = ${schema.socialQueue.id}
      ORDER BY sp.created_at DESC, sp.id DESC
      LIMIT 1
    )`.as('published_external_post_id'),
    publishedStatus: sql<string | null>`(
      SELECT sp.status
      FROM social_posts sp
      WHERE sp.queue_id = ${schema.socialQueue.id}
      ORDER BY sp.created_at DESC, sp.id DESC
      LIMIT 1
    )`.as('published_status'),
    publishedAt: sql<string | null>`(
      SELECT sp.posted_at
      FROM social_posts sp
      WHERE sp.queue_id = ${schema.socialQueue.id}
      ORDER BY sp.created_at DESC, sp.id DESC
      LIMIT 1
    )`.as('published_at')
  })
    .from(schema.socialQueue)
    .innerJoin(schema.images, eq(schema.socialQueue.imageId, schema.images.id))
    .leftJoin(schema.users, eq(schema.images.userId, schema.users.id))
    .where(whereCondition)
    .orderBy(
      asc(sql`CASE WHEN ${schema.socialQueue.status} = 'queued' THEN 0 ELSE 1 END`),
      asc(schema.socialQueue.position),
      desc(schema.socialQueue.updatedAt)
    )
    .limit(limit)
    .offset(offset)

  const totalRows = await db.select({ total: count() })
    .from(schema.socialQueue)
    .innerJoin(schema.images, eq(schema.socialQueue.imageId, schema.images.id))
    .where(whereCondition)

  const queueStats = await db.select({
    queued: sql<number>`SUM(CASE WHEN ${schema.socialQueue.status} = 'queued' THEN 1 ELSE 0 END)`,
    processing: sql<number>`SUM(CASE WHEN ${schema.socialQueue.status} = 'processing' THEN 1 ELSE 0 END)`,
    posted: sql<number>`SUM(CASE WHEN ${schema.socialQueue.status} = 'posted' THEN 1 ELSE 0 END)`,
    failed: sql<number>`SUM(CASE WHEN ${schema.socialQueue.status} = 'failed' THEN 1 ELSE 0 END)`
  })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.platform, platform))

  const total = Number(totalRows[0]?.total || 0)

  return {
    success: true,
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
    stats: {
      queued: Number(queueStats[0]?.queued || 0),
      processing: Number(queueStats[0]?.processing || 0),
      posted: Number(queueStats[0]?.posted || 0),
      failed: Number(queueStats[0]?.failed || 0),
    }
  }
})