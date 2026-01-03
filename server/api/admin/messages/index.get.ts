// GET /api/admin/messages

import { db } from 'hub:db'
import { sql } from 'drizzle-orm'
import type { Message } from "~~/shared/types/message"

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

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20
  const readFilter = query.read as string // 'true', 'false', or undefined for all
  const search = query.search as string || ''
  const offset = (page - 1) * limit

  try {
    let whereClause = ''

    // Build WHERE clause for filtering
    const conditions: string[] = []
    
    if (readFilter !== undefined) {
      conditions.push(`read = ${readFilter === 'true' ? 1 : 0}`)
    }

    if (search) {
      const escapedSearch = search.replace(/'/g, "''")
      conditions.push(`(sender_email LIKE '%${escapedSearch}%' OR subject LIKE '%${escapedSearch}%' OR message LIKE '%${escapedSearch}%')`)
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ')
    }

    // Get total count for pagination
    const countQuery = sql.raw(`SELECT COUNT(*) as total FROM messages ${whereClause}`)
    const countResult = await db.get(countQuery) as { total: number } | undefined
    const total = countResult?.total || 0

    // Get messages with pagination
    const messagesQuery = `
      SELECT 
        id,
        sender_email,
        subject,
        message,
        read,
        created_at,
        updated_at
      FROM messages 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    
    const messagesResult = await db
      .all(sql.raw(messagesQuery)) as unknown as Message[]

    return {
      success: true,
      data: {
        messages: messagesResult,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch messages'
    })
  }
})