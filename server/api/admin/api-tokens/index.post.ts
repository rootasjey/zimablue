import { z } from 'zod'
import { db } from 'hub:db'
import { eq } from 'drizzle-orm'
import { apiTokens, users } from '../../../db/schema'
import { requireApiAdmin, generateToken, hashToken } from '../../../utils/api-auth'
import { apiSuccess } from '../../../utils/api-response'

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  userId: z.number().int().positive(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
})

export default defineEventHandler(async (event) => {
  await requireApiAdmin(event)
  const { name, userId, expiresInDays } = await readValidatedBody(event, bodySchema.parse)

  const user = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .get()

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const rawToken = generateToken()
  const tokenHash = await hashToken(rawToken)

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null

  const tokens = await db.insert(apiTokens)
    .values({
      userId,
      name,
      tokenHash,
      expiresAt,
    })
    .returning()

  const created = tokens[0]
  if (!created) {
    throw createError({ statusCode: 500, message: 'Failed to create token' })
  }

  return apiSuccess({
    id: created.id,
    name: created.name,
    userId: created.userId,
    token: rawToken,
    expires_at: created.expiresAt,
    created_at: created.createdAt,
  })
})
