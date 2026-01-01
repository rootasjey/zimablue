// PATCH /api/admin/users/[id]

import { db } from '~/server/utils/database'
import { sql } from 'drizzle-orm'
import type { UserFormData } from "~/types/user"

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
    const existingUser = await db.get(sql`SELECT id FROM users WHERE id = ${userId}`)
    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Build update query dynamically based on provided fields
    const updateFields: string[] = []
    const params: any[] = []

    if (body.name !== undefined) {
      updateFields.push('name = ?')
      params.push(body.name)
    }
    if (body.email !== undefined) {
      updateFields.push('email = ?')
      params.push(body.email)
    }
    if (body.role !== undefined) {
      updateFields.push('role = ?')
      params.push(body.role)
    }
    if (body.biography !== undefined) {
      updateFields.push('biography = ?')
      params.push(body.biography)
    }
    if (body.job !== undefined) {
      updateFields.push('job = ?')
      params.push(body.job)
    }
    if (body.language !== undefined) {
      updateFields.push('language = ?')
      params.push(body.language)
    }
    if (body.location !== undefined) {
      updateFields.push('location = ?')
      params.push(body.location)
    }
    if (body.socials !== undefined) {
      updateFields.push('socials = ?')
      params.push(body.socials)
    }

    if (updateFields.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No fields to update'
      })
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    params.push(userId)

    const updateQuery = sql.raw(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `)

    await db.run(updateQuery, params)

    // Fetch and return updated user
    const updatedUser = await db.get(sql`
      SELECT 
        id, name, email, role, biography, job, language, location, socials, created_at, updated_at
      FROM users 
      WHERE id = ${userId}
    `)

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
