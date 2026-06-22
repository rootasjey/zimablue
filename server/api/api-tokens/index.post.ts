import { z } from 'zod'
import { db } from 'hub:db'
import { apiTokens } from '../../db/schema'
import { requireApiAuth, generateToken, hashToken } from '../../utils/api-auth'
import { apiSuccess } from '../../utils/api-response'

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().int().min(1).max(365).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireApiAuth(event)
  const { name, expiresInDays } = await readValidatedBody(event, bodySchema.parse)

  const rawToken = generateToken()
  const tokenHash = await hashToken(rawToken)

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null

  const tokens = await db.insert(apiTokens)
    .values({
      userId: user.id,
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
    token: rawToken,
    expires_at: created.expiresAt,
    created_at: created.createdAt,
  })
})
