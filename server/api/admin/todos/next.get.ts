// GET /api/admin/todos/next
// Returns the next upcoming todo (earliest due_date, not completed)

import { Todo } from "~/types/todo"

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

  try {
    const db = hubDatabase()

    // Get the next upcoming todo (not completed, earliest due_date)
    const todo = await db
      .prepare(`
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
        WHERE status != 'completed'
        ORDER BY due_date ASC, priority DESC
        LIMIT 1
      `)
      .first()

    if (!todo) {
      return {
        success: true,
        data: null
      }
    }

    return {
      success: true,
      data: todo as unknown as Todo
    }
  } catch (error) {
    console.error('Error fetching next todo:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch next todo'
    })
  }
})

