// DELETE /api/admin/messages/[id]

import { sql } from 'drizzle-orm'

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

    // Delete message
    await db
      .run(sql`DELETE FROM messages WHERE id = ${parseInt(messageId)}`)

    return {
      success: true,
      message: 'Message deleted successfully',
      data: existingMessage,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error deleting message:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete message'
    })
  }
})