import { z } from 'zod'

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

    // Insert message into database using hubDatabase
    const result = await hubDatabase()
      .prepare(`
        INSERT INTO messages (sender_email, subject, message)
        VALUES (?1, ?2, ?3)
        RETURNING *
      `)
      .bind(
        validatedData.email,
        validatedData.subject,
        validatedData.message
      )
      .first()

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
        data: error.errors
      })
    }

    // Otherwise return a generic 500 error
    throw createError({
      statusCode: 500,
      message: 'An unexpected error occurred',
    })
  }
})