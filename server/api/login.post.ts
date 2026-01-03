import { db } from 'hub:db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import type { DbUser } from '#shared/types/database'
import { users } from '../db/schema'

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)

  const userData = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .get() as DbUser | undefined

  if (!userData) {
    throw createError({
      statusCode: 401,
      message: 'Bad credentials'
    })
  }

  const isValidPassword = await verifyPassword(userData.password as string, password)
  
  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: 'Bad credentials'
    })
  }

  const user = {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    biography: userData.biography || '',
    job: userData.job || '',
    language: userData.language || '',
    location: userData.location || '',
    socials: userData.socials || '',
    createdAt: userData.created_at,
    updatedAt: userData.updated_at || userData.created_at,
  }

  await setUserSession(event, { user })
  return { user }
})
