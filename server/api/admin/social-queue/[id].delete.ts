import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { isAdminSession } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const queueId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(queueId) || queueId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid queue id' })
  }

  const deleted = await db.delete(schema.socialQueue)
    .where(eq(schema.socialQueue.id, queueId))
    .returning({ id: schema.socialQueue.id })

  if (!deleted.length) {
    throw createError({ statusCode: 404, statusMessage: 'Queue item not found' })
  }

  return {
    success: true,
    data: deleted[0],
  }
})