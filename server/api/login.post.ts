import { db } from '~/server/utils/database'
import { z } from 'zod'
import { sql } from 'drizzle-orm'

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)

  const userData = await db.get(sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `)

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
    createdAt: userData.created_at,
    email: userData.email,
    id: userData.id,
    name: userData.name,
    role: userData.role,
  }

  await setUserSession(event, { user })
  return { user }
})
