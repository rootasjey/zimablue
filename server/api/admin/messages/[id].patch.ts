// PATCH /api/admin/messages/[id]

import { sql } from 'drizzle-orm'
import type { Message } from "~/types/message"

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

  const messageId = getRouterParam(event, 'id')
  
  if (!messageId || isNaN(parseInt(messageId))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid message ID required'
    })
  }

  const body = await readBody(event)
  
  if (typeof body.read !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Read status must be a boolean'
    })
  }

  try {
    // Check if message exists
    const existingMessage = await db
      .get(sql`SELECT id FROM messages WHERE id = ${parseInt(messageId)}`)

    if (!existingMessage) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Message not found'
      })
    }

    // Update read status
    await db
      .run(sql`UPDATE messages SET read = ${body.read ? 1 : 0}, updated_at = CURRENT_TIMESTAMP WHERE id = ${parseInt(messageId)}`)

    // Fetch updated message
    const updatedMessage = await db
      .get(sql`
        SELECT 
          id,
          sender_email,
          subject,
          message,
          read,
          created_at,
          updated_at
        FROM messages 
        WHERE id = ${parseInt(messageId)}
      `)

    return {
      success: true,
      data: updatedMessage as unknown as Message,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error updating message:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update message'
    })
  }
})