import { db } from 'hub:db'
import { z } from 'zod'
import { messages } from '../../db/schema'

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate the request body
    const body = await readBody(event)

    const messageSchema = z.object({
      email: z.string().email('Invalid email format'),
      subject: z.string().min(1, 'Subject is required'),
      message: z.string().min(1, 'Message is required')
    })

    const validatedData = messageSchema.parse(body)

    // Insert message into database using Drizzle
    const result = await db.insert(messages)
      .values({
        senderEmail: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message
      })
      .returning()
      .get()

    if (!result) {
      throw createError({
        statusCode: 500,
        message: 'Failed to save message',
      })
    }

    return {
      success: true,
      message: 'Message sent successfully',
      data: result
    }
  } catch (error: unknown) {
    console.error('Error in message submission:', error)

    // If it's a Zod validation error, return a 400 response
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation error',
        data: error.issues
      })
    }

    // Otherwise return a generic 500 error
    throw createError({
      statusCode: 500,
      message: 'An unexpected error occurred',
    })
  }
})