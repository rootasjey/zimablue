import { db } from 'hub:db'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { passwordResetTokens, users } from '../../db/schema'
import { hashPasswordResetToken } from '../../utils/password-reset'
import { apiSuccess } from '../../utils/api-response'

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const { token, password } = await readValidatedBody(event, bodySchema.parse)
  const tokenHash = await hashPasswordResetToken(token)
  const resetToken = await db.select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt)))
    .limit(1)
    .get()

  if (!resetToken || resetToken.expiresAt.getTime() <= Date.now()) {
    throw createError({ statusCode: 400, message: 'This password reset link is invalid or has expired.' })
  }

  await db.update(users)
    .set({ password: await hashPassword(password), updatedAt: new Date() })
    .where(eq(users.id, resetToken.userId))
  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id))

  return apiSuccess(undefined, undefined, 'Password reset successfully. You can now sign in.')
})
