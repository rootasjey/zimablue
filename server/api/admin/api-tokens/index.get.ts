import { db } from 'hub:db'
import { sql, eq, count } from 'drizzle-orm'
import { apiTokens, users } from '../../../db/schema'
import { requireApiAdmin } from '../../../utils/api-auth'
import { apiSuccess, computePagination } from '../../../utils/api-response'
import { keysToSnake } from '../../../utils/case'

export default defineEventHandler(async (event) => {
  await requireApiAdmin(event)

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(Number(query.limit) || 20, 100)
  const offset = (page - 1) * limit
  const search = String(query.search || '')

  let whereClause = sql`1=1`
  if (search) {
    whereClause = sql`(${apiTokens.name} LIKE ${'%' + search + '%'} OR ${users.name} LIKE ${'%' + search + '%'})`
  }

  const countResult = await db.select({ total: count() })
    .from(apiTokens)
    .leftJoin(users, eq(apiTokens.userId, users.id))
    .where(whereClause)
    .get() as { total: number } | undefined

  const total = countResult?.total || 0

  const tokens = await db.select({
    id: apiTokens.id,
    userId: apiTokens.userId,
    name: apiTokens.name,
    lastUsedAt: apiTokens.lastUsedAt,
    expiresAt: apiTokens.expiresAt,
    revoked: apiTokens.revoked,
    createdAt: apiTokens.createdAt,
    updatedAt: apiTokens.updatedAt,
    userName: users.name,
    userEmail: users.email,
  })
    .from(apiTokens)
    .leftJoin(users, eq(apiTokens.userId, users.id))
    .where(whereClause)
    .orderBy(sql`${apiTokens.createdAt} DESC`)
    .limit(limit)
    .offset(offset)
    .all()

  const totalPages = Math.ceil(total / limit)

  return {
    success: true,
    data: tokens.map(keysToSnake),
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  }
})
