// GET /api/admin/todos

import { db } from 'hub:db'
import { sql } from 'drizzle-orm'
import type { Todo } from "~~/shared/types/todo"

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
  const status = query.status as string // 'pending', 'in_progress', 'completed', or undefined for all
  const priority = query.priority as string // 'low', 'medium', 'high', or undefined for all
  const search = query.search as string || ''
  const offset = (page - 1) * limit

  try {
    let whereClause = ''

    // Build WHERE clause for filtering
    const conditions: string[] = []
    
    if (status) {
      conditions.push(`status = '${status}'`)
    }

    if (priority) {
      conditions.push(`priority = '${priority}'`)
    }

    if (search) {
      const escapedSearch = search.replace(/'/g, "''")
      conditions.push(`(title LIKE '%${escapedSearch}%' OR description LIKE '%${escapedSearch}%')`)
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ')
    }

    // Get total count for pagination
    const countQuery = sql.raw(`SELECT COUNT(*) as total FROM todos ${whereClause}`)
    const countResult = await db.get(countQuery) as { total: number } | undefined
    const total = countResult?.total || 0

    // Get todos with pagination
    const todosQuery = `
      SELECT 
        id,
        title,
        description,
        due_date,
        status,
        priority,
        created_at,
        updated_at,
        user_id
      FROM todos 
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN status = 'pending' THEN 1
          WHEN status = 'in_progress' THEN 2
          WHEN status = 'completed' THEN 3
        END,
        due_date ASC,
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END
      LIMIT ${limit} OFFSET ${offset}
    `
    
    const todos = await db
      .all(sql.raw(todosQuery)) as unknown as Todo[]

    return {
      success: true,
      data: {
        todos: todos,
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
    console.error('Error fetching todos:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch todos'
    })
  }
})

