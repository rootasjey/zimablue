import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)

  if (email === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    // set the user session in the cookie
    // this server util is auto-imported by the auth-utils module

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

    await setUserSession(event, {
      user: {
        createdAt: userData.created_at,
        email,
        id: userData.id,
        name: userData.name,
        role: userData.role,
      }
    })
    return {}
  }
  throw createError({
    statusCode: 401,
    message: 'Bad credentials'
  })
})
