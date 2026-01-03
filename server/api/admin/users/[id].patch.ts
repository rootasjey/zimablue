// PATCH /api/admin/users/[id]

import { db } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { UserFormData } from "~~/shared/types/user"
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

  const body = await readBody(event) as Partial<UserFormData>

  try {
    // Check if user exists
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, Number(userId)))
      .get()
      
    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Build update object dynamically based on provided fields
    const updateData: Partial<typeof users.$inferInsert> = {}

    if (body.name !== undefined) {
      updateData.name = body.name
    }
    if (body.email !== undefined) {
      updateData.email = body.email
    }
    if (body.role !== undefined) {
      updateData.role = body.role as 'admin' | 'user'
    }
    if (body.biography !== undefined) {
      updateData.biography = body.biography
    }
    if (body.job !== undefined) {
      updateData.job = body.job
    }
    if (body.language !== undefined) {
      updateData.language = body.language
    }
    if (body.location !== undefined) {
      updateData.location = body.location
    }
    if (body.socials !== undefined) {
      updateData.socials = body.socials
    }

    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No fields to update'
      })
    }

    // Update user
    await db.update(users)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(users.id, Number(userId)))

    // Fetch and return updated user
    const updatedUser = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      biography: users.biography,
      job: users.job,
      language: users.language,
      location: users.location,
      socials: users.socials,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    })
      .from(users)
      .where(eq(users.id, Number(userId)))
      .get()

    return {
      success: true,
      data: updatedUser
    }
  } catch (error) {
    console.error('Error updating user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user'
    })
  }
})
