import { db } from 'hub:db'
import type { User } from "#auth-utils"
import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'

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

    // Fetch user profile data
    const user = await db.select({
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

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    return {
      success: true,
      data: user as unknown as User
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error fetching user profile:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})