// PATCH /api/admin/todos/:id

import { z } from 'zod'
import { sql } from 'drizzle-orm'
import type { Todo } from '~/types/todo'
import { isAdminSession } from '~/server/utils/auth'

const updateTodoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
})

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  if (!isAdminSession(session)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Todo ID is required'
    })
  }

  const body = await readBody(event)
  
  // Validate input
  const validationResult = updateTodoSchema.safeParse(body)
  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: validationResult.error.issues
    })
  }

  const data = validationResult.data

  // Check if there's anything to update
  if (Object.keys(data).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No fields to update'
    })
  }

  try {
    // Check if todo exists
    const existingTodo = await db
      .get(sql`SELECT * FROM todos WHERE id = ${id}`)

    if (!existingTodo) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Todo not found'
      })
    }

    // Build update query dynamically
    const updates: string[] = []
    const params: any[] = []

    if (data.title !== undefined) {
      updates.push('title = ?')
      params.push(data.title)
    }
    if (data.description !== undefined) {
      updates.push('description = ?')
      params.push(data.description)
    }
    if (data.due_date !== undefined) {
      updates.push('due_date = ?')
      params.push(data.due_date)
    }
    if (data.status !== undefined) {
      updates.push('status = ?')
      params.push(data.status)
    }
    if (data.priority !== undefined) {
      updates.push('priority = ?')
      params.push(data.priority)
    }

    // Add the ID as the last parameter
    params.push(id)

    const updateQuery = sql.raw(`
      UPDATE todos 
      SET ${updates.join(', ')}
      WHERE id = ?
    `)

    const result = await db
      .run(updateQuery, params)

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update todo'
      })
    }

    // Get the updated todo
    const updatedTodo = await db
      .get(sql`SELECT * FROM todos WHERE id = ${id}`)

    return {
      success: true,
      data: updatedTodo as unknown as Todo
    }
  } catch (error) {
    console.error('Error updating todo:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update todo'
    })
  }
})

