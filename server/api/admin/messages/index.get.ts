// GET /api/admin/messages

import { db } from 'hub:db'
import { sql, type SQL } from 'drizzle-orm'
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
  const page = Math.max(Number.parseInt((query.page as string) || '1', 10) || 1, 1)
  const limit = Math.min(Math.max(Number.parseInt((query.limit as string) || '20', 10) || 20, 1), 100)
  const readFilter = query.read as string // 'true', 'false', or undefined for all
  const search = (query.search as string || '').trim()
  const offset = (page - 1) * limit

  try {
    const conditions: SQL[] = []
    
    if (readFilter !== undefined) {
      conditions.push(sql`read = ${readFilter === 'true' ? 1 : 0}`)
    }

    if (search) {
      const pattern = `%${search}%`
      conditions.push(sql`(sender_email LIKE ${pattern} OR subject LIKE ${pattern} OR message LIKE ${pattern})`)
    }

    const whereClause = conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``

    // Get total count for pagination
    const countQuery = sql`SELECT COUNT(*) as total FROM messages ${whereClause}`
    const countResult = await db.get(countQuery) as { total: number } | undefined
    const total = countResult?.total || 0

    // Get messages with pagination
    const messagesQuery = sql`
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
      .all(messagesQuery) as unknown as Message[]

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