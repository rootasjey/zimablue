// DELETE /api/admin/todos/:id

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
    const db = hubDatabase()

    // Check if todo exists
    const existingTodo = await db
      .prepare('SELECT * FROM todos WHERE id = ?')
      .bind(id)
      .first()

    if (!existingTodo) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Todo not found'
      })
    }

    // Delete the todo
    const result = await db
      .prepare('DELETE FROM todos WHERE id = ?')
      .bind(id)
      .run()

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

