import { z } from 'zod'
import { db } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import { apiTokens } from '../../db/schema'
import { requireApiAuth } from '../../utils/api-auth'
import { apiSuccess } from '../../utils/api-response'

export default defineEventHandler(async (event) => {
  const user = await requireApiAuth(event)
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.coerce.number().int().positive(),
  }).parse)

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

  await db.update(apiTokens)
    .set({ revoked: true })
    .where(eq(apiTokens.id, id))

  return apiSuccess({ id, revoked: true })
})
