import { db } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { apiTokens } from '../../db/schema'
import { requireApiAuth } from '../../utils/api-auth'
import { apiSuccess } from '../../utils/api-response'
import { keysToSnake } from '../../utils/case'

export default defineEventHandler(async (event) => {
  const user = await requireApiAuth(event)

  const tokens = await db.select({
    id: apiTokens.id,
    userId: apiTokens.userId,
    name: apiTokens.name,
    lastUsedAt: apiTokens.lastUsedAt,
    expiresAt: apiTokens.expiresAt,
    revoked: apiTokens.revoked,
    createdAt: apiTokens.createdAt,
    updatedAt: apiTokens.updatedAt,
  })
    .from(apiTokens)
    .where(eq(apiTokens.userId, user.id))
    .orderBy(sql`${apiTokens.revoked} ASC, ${apiTokens.createdAt} DESC`)
    .all()

  return apiSuccess(tokens.map(keysToSnake))
})
