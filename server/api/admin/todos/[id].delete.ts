// DELETE /api/admin/todos/:id

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

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Todo ID is required'
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

    // Delete the todo
    const result = await db
      .run(sql`DELETE FROM todos WHERE id = ${id}`)

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete todo'
      })
    }

    return {
      success: true,
      message: 'Todo deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting todo:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete todo'
    })
  }
})

