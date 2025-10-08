// POST /api/admin/todos

import { z } from 'zod'
import { Todo } from '~/types/todo'

const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().default(''),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  status: z.enum(['pending', 'in_progress', 'completed']).optional().default('pending'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
})

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

  const body = await readBody(event)
  
  // Validate input
  const validationResult = createTodoSchema.safeParse(body)
  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validationResult.error.errors
    })
  }

  const data = validationResult.data

  try {
    const db = hubDatabase()

    // Insert the todo
    const insertQuery = `
      INSERT INTO todos (title, description, due_date, status, priority, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    
    const result = await db
      .prepare(insertQuery)
      .bind(
        data.title,
        data.description,
        data.due_date,
        data.status,
        data.priority,
        session.user.id
      )
      .run()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create todo'
      })
    }

    // Get the created todo
    const todoId = result.meta.last_row_id
    const todo = await db
      .prepare('SELECT * FROM todos WHERE id = ?')
      .bind(todoId)
      .first()

    return {
      success: true,
      data: todo as unknown as Todo
    }
  } catch (error) {
    console.error('Error creating todo:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create todo'
    })
  }
})

