import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)

  const userData = await hubDatabase()
    .prepare('SELECT * FROM users WHERE email = ?1 LIMIT 1')
    .bind(email)
    .first()

  if (!userData) {
    throw createError({
      statusCode: 401,
      message: 'Bad credentials'
    })
  }

  // verifyPassword is provided by `nuxt-auth-utils` (exposed by module).
  // Be defensive: make sure the helper exists and catch unexpected exceptions so
  // we return a clear 500 error and log the underlying cause in production.
  if (typeof verifyPassword !== 'function') {
    console.error('verifyPassword helper is not available. Is `nuxt-auth-utils` installed?')
    throw createError({ statusCode: 500, message: 'Server Error' })
  }

  let isValidPassword: boolean
  try {
    isValidPassword = await verifyPassword(userData.password as string, password)
  } catch (err: any) {
    console.error('Error while verifying password:', err)
    // Internal error — avoid leaking details to clients
    throw createError({ statusCode: 500, message: 'Server Error' })
  }

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
