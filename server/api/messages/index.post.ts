import { db } from 'hub:db'
import { z } from 'zod'
import { messages } from '../../db/schema'
import { apiSuccess } from '../../utils/api-response'

const bodySchema = z.object({
  email: z.string().email('Invalid email format'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
})

export default defineEventHandler(async (event) => {
  const { email, subject, message } = await readValidatedBody(event, bodySchema.parse)

  const results = await db.insert(messages)
    .values({ senderEmail: email, subject, message })
    .returning()

  const result = results[0]
  if (!result) {
    throw createError({ statusCode: 500, message: 'Failed to save message' })
  }

  return apiSuccess({ id: result.id, createdAt: result.createdAt }, undefined, 'Message sent successfully')
})