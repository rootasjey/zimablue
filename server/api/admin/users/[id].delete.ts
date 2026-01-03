// DELETE /api/admin/users/[id]

import { db } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { users } from '../../../db/schema'

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
    // Check if user exists
    const existingUser = await db.select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, Number(userId)))
      .get() as { id: number; role: string } | undefined
      
    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Check if this is the last admin user
    if (existingUser.role === 'admin') {
      const adminCount = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, 'admin'))
        .get() as { count: number } | undefined
        
      if ((adminCount?.count || 0) <= 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot delete the last admin user'
        })
      }
    }

    // Delete user (this will cascade to related data due to foreign key constraints)
    await db.delete(users)
      .where(eq(users.id, Number(userId)))

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
