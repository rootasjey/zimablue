import { db } from 'hub:db'
import { eq, and } from 'drizzle-orm'
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
    .where(and(
      eq(apiTokens.userId, user.id),
      eq(apiTokens.revoked, false),
    ))
    .orderBy(apiTokens.createdAt)
    .all()

  return apiSuccess(tokens.map(keysToSnake))
})
