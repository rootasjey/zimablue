import { db } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { passwordResetTokens, users } from '../../db/schema'
import { generatePasswordResetToken, hashPasswordResetToken } from '../../utils/password-reset'
import { emailHtml, getSiteUrl, sendEmail } from '../../utils/email'
import { apiSuccess } from '../../utils/api-response'

const bodySchema = z.object({ email: z.email() })

export default defineEventHandler(async (event) => {
  const { email } = await readValidatedBody(event, bodySchema.parse)
  const user = await db.select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .get()

  if (user) {
    const rawToken = generatePasswordResetToken()
    const tokenHash = await hashPasswordResetToken(rawToken)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt })

    const resetUrl = `${getSiteUrl(event)}/reset-password?token=${encodeURIComponent(rawToken)}`
    try {
      await sendEmail(event, {
        to: user.email,
        subject: 'Reset your Zima Blue password',
        text: `Hi ${user.name},\n\nReset your password here: ${resetUrl}\n\nThis link expires in one hour.`,
        html: emailHtml(`Hi ${user.name},\n\nReset your password here: ${resetUrl}\n\nThis link expires in one hour.`),
      })
    } catch (error) {
      console.error('Password reset email error:', error)
    }
  }

  return apiSuccess(undefined, undefined, 'If an account exists for that email, a reset link has been sent.')
})
