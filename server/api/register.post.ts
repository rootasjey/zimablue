import { db } from 'hub:db'
import { z } from 'zod'
import { sql, eq, or } from 'drizzle-orm'
import { users } from '../db/schema'
import type { DbUser } from '#shared/types/database'

const bodySchema = z.object({
  name: z.string().min(2).max(50),
  email: z.email(),
  password: z.string().min(8),
  biography: z.string().optional(),
  job: z.string().optional(),
  language: z.string().optional(),
  location: z.string().optional(),
  socials: z.string().optional()
})

// Helper to safely convert timestamps to ISO strings
function toISOString(value: Date | string | number | null | undefined): string {
  if (!value) return new Date().toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'number') return new Date(value * 1000).toISOString()
  return value.toISOString()
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const { name, email, password, biography, job, language, location, socials } = body

  try {
    // Check if user already exists (split into two queries to avoid a libsql normalization edge case)
    // Check if user already exists using Drizzle typed query
    const existingUsers = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.name, name)))
      .limit(1)

    if (existingUsers.length > 0) {
      throw createError({
        statusCode: 409,
        message: 'User with this email or name already exists'
      })
    }

    // Hash the password using nuxt-auth-utils script.
    const hashedPassword = await hashPassword(password)

    // Insert new user using Drizzle typed query
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        biography: biography || '',
        job: job || '',
        language: language || 'en',
        location: location || '',
        socials: socials || '[]',
        role: 'user'
      })
      .returning()

    if (!newUser) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create user'
      })
    }

    // Set user session
    await setUserSession(event, {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        biography: newUser.biography || '',
        job: newUser.job || '',
        language: newUser.language || '',
        location: newUser.location || '',
        socials: newUser.socials || '',
        createdAt: toISOString(newUser.createdAt),
        updatedAt: toISOString(newUser.updatedAt || newUser.createdAt),
      }
    })

    return {
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: toISOString(newUser.createdAt)
      }
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Registration error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error during registration'
    })
  }
})