import { db } from 'hub:db'
import { messages } from '../../db/schema'
import { validateContactInput } from '../../utils/contact'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validation = validateContactInput(body)
  if (!validation.valid) {
    throw createError({ statusCode: 400, message: validation.error! })
  }

  try {
    const result = await db.insert(messages)
      .values({
        senderEmail: body.email,
        subject: body.subject,
        message: body.message
      })
      .returning()
      .get()
    
    if (!result) {
      throw new Error('Failed to save message')
    }
    
    return {
      success: true,
      message: 'Your message has been sent successfully!'
    }
  } catch (error) {
    console.error('Error saving message:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to save your message. Please try again later.'
    })
  }
})