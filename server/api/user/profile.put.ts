import { db } from '~/server/utils/database'
import type { User } from '#auth-utils'
import { z } from 'zod'
import { sql } from 'drizzle-orm'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.email('Invalid email format').optional(),
  biography: z.string().max(1000, 'Biography too long').optional(),
  job: z.string().max(100, 'Job title too long').optional(),
  location: z.string().max(100, 'Location too long').optional(),
  language: z.string().max(10, 'Language code too long').optional(),
  socials: z.string().optional() // JSON string, we'll validate JSON format separately
})

export default eventHandler(async (event) => {
  try {
    // Check authentication
    const session = await requireUserSession(event)
    if (!session.user || (session.user as any).id == null) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const userId = (session.user as any).id as number
    const body = await readBody(event)

    // Validate input data
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: validationResult.error.issues
      })
    }

    const updateData = validationResult.data

    // Validate socials JSON if provided
    if (updateData.socials) {
      try {
        JSON.parse(updateData.socials)
      } catch {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid socials JSON format'
        })
      }
    }

    // Build dynamic update query
    const updateFields: string[] = []
    const updateValues: any[] = []
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`)
        updateValues.push(value)
      }
    })

    if (updateFields.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No fields to update'
      })
    }

    // Add userId and updated_at to the query
    updateValues.push(new Date().toISOString(), userId)

    const updateQueryString = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = ?
      WHERE id = ?
    `

    const updateQuery = sql.raw(updateQueryString)

    // Execute update
    try {
      await (db as any).run(updateQuery, updateValues)
    } catch (error: any) {
      // Handle unique constraint violations
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        if (error.message.includes('idx_users_email')) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Email already exists'
          })
        }
        if (error.message.includes('idx_users_name')) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Username already exists'
          })
        }
      }
      
      console.error('Database error updating user profile:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile'
      })
    }

    // Fetch updated user data
    const updatedUser = await db.get(sql`
      SELECT id, name, email, biography, job, location, language, socials, created_at, updated_at
      FROM users 
      WHERE id = ${userId}
    `)

    if (!updatedUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Update session with new user data
    await replaceUserSession(event, {
      user: {
        ...session.user,
        ...updatedUser,
      }
    })

    return {
      success: true,
      data: updatedUser as unknown as User,
      message: 'Profile updated successfully'
    }

  } catch (error: any) {
    // Re-throw createError instances
    if (error.statusCode) {
      throw error
    }

    console.error('Unexpected error updating user profile:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})