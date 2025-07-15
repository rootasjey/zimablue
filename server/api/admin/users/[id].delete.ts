// DELETE /api/admin/users/[id]

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

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  // Prevent admin from deleting themselves
  if (parseInt(userId) === session.user.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot delete your own account'
    })
  }

  try {
    const db = hubDatabase()

    // Check if user exists
    const existingUser = await db.prepare('SELECT id, role FROM users WHERE id = ?').bind(userId).first()
    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Check if this is the last admin user
    if (existingUser.role === 'admin') {
      const adminCount = await db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').bind('admin').first()
      if ((adminCount?.count as number) <= 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot delete the last admin user'
        })
      }
    }

    // Delete user (this will cascade to related data due to foreign key constraints)
    await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()

    return {
      success: true,
      message: 'User deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete user'
    })
  }
})
