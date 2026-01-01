import { db } from '~/server/utils/database'
import { z } from 'zod'
import { sql } from 'drizzle-orm'

const bodySchema = z.object({
  name: z.string().min(2).max(50),
  email: z.email(),
  password: z.string().min(8),
  masterPassword: z.string().min(1),
  biography: z.string().optional(),
  job: z.string().optional(),
  language: z.string().optional(),
  location: z.string().optional(),
  socials: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const { name, email, password, masterPassword, biography, job, language, location, socials } = body

  try {
    // Check if master password is correct
    if (masterPassword !== process.env.ADMIN_PASSWORD) {
      throw createError({
        statusCode: 401,
        message: 'Master password is incorrect'
      })
    }

    // Check if user already exists
    const existingUser = await db.get(sql`
      SELECT id FROM users WHERE email = ${email} OR name = ${name} LIMIT 1
    `)

    if (existingUser) {
      throw createError({
        statusCode: 409,
        message: 'User with this email or name already exists'
      })
    }

    // Hash the password using nuxt-auth-utils script.
    const hashedPassword = await hashPassword(password)

    // Insert new user
    const newUser = await db.get(sql`
      INSERT INTO users (name, email, password, biography, job, language, location, socials, role)
      VALUES (${name}, ${email}, ${hashedPassword}, ${biography || null}, ${job || null}, ${language || null}, ${location || null}, ${socials || null}, 'user')
      RETURNING *
    `)

    if (!newUser) {
      throw createError({
        statusCode: 500,
        message: 'Failed to retrieve created user'
      })
    }

    // Set user session
    await setUserSession(event, {
      user: {
        createdAt: newUser.created_at,
        email: newUser.email,
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
      }
    })

    return {
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at
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