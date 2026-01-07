import { db } from 'hub:db'
import type { User } from '#auth-utils'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'

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

    // Build dynamic update object
    const updateValues: Partial<typeof users.$inferInsert> = {}
    
    if (updateData.name !== undefined) {
      updateValues.name = updateData.name
    }
    if (updateData.email !== undefined) {
      updateValues.email = updateData.email
    }
    if (updateData.biography !== undefined) {
      updateValues.biography = updateData.biography
    }
    if (updateData.job !== undefined) {
      updateValues.job = updateData.job
    }
    if (updateData.location !== undefined) {
      updateValues.location = updateData.location
    }
    if (updateData.language !== undefined) {
      updateValues.language = updateData.language
    }
    if (updateData.socials !== undefined) {
      updateValues.socials = updateData.socials
    }

    if (Object.keys(updateValues).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No fields to update'
      })
    }

    // Execute update
    try {
      await db.update(users)
        .set({
          ...updateValues,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
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
    const updatedUser = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      biography: users.biography,
      job: users.job,
      location: users.location,
      language: users.language,
      socials: users.socials,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    })
      .from(users)
      .where(eq(users.id, userId))
      .get()

    if (!updatedUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Sanitize nullable fields to match expected `User` type (avoid nulls)
    const sanitizedUser = {
      ...updatedUser,
      biography: updatedUser.biography ?? '',
      job: updatedUser.job ?? '',
      location: updatedUser.location ?? '',
      language: updatedUser.language ?? '',
      socials: updatedUser.socials ?? '',
      createdAt: updatedUser.createdAt instanceof Date ? updatedUser.createdAt.toISOString() : String(updatedUser.createdAt),
      updatedAt: updatedUser.updatedAt instanceof Date ? updatedUser.updatedAt.toISOString() : String(updatedUser.updatedAt),
    }

    // Update session with new user data
    await replaceUserSession(event, {
      user: {
        ...session.user,
        ...sanitizedUser,
      }
    })

    return {
      success: true,
      data: sanitizedUser as unknown as User,
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