import { z } from 'zod'
import { db } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import { apiTokens } from '../../db/schema'
import { requireApiAuth } from '../../utils/api-auth'
import { apiSuccess } from '../../utils/api-response'
import { keysToSnake } from '../../utils/case'

const bodySchema = z.object({
  name: z.string().min(1).max(100),
})

export default defineEventHandler(async (event) => {
  const user = await requireApiAuth(event)
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.coerce.number().int().positive(),
  }).parse)
  const { name } = await readValidatedBody(event, bodySchema.parse)

  const token = await db.select()
    .from(apiTokens)
    .where(and(
      eq(apiTokens.id, id),
      eq(apiTokens.userId, user.id),
    ))
    .get()

  if (!token) {
    throw createError({ statusCode: 404, message: 'Token not found' })
  }

  const updated = await db.update(apiTokens)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(eq(apiTokens.id, id))
    .returning()

  const result = updated[0]
  if (!result) {
    throw createError({ statusCode: 500, message: 'Failed to update token' })
  }

  return apiSuccess(keysToSnake({
    id: result.id,
    userId: result.userId,
    name: result.name,
    lastUsedAt: result.lastUsedAt,
    expiresAt: result.expiresAt,
    revoked: result.revoked,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }))
})
