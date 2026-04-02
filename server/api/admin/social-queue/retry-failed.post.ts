import { db, schema } from 'hub:db'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { isAdminSession } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const queueIds = Array.isArray(body?.queueIds)
    ? body.queueIds.map((value: unknown) => Number(value)).filter((value: number) => Number.isInteger(value) && value > 0)
    : []

  const platform = body?.platform ? String(body.platform) : undefined
  const conditions = [eq(schema.socialQueue.status, 'failed')]
  if (queueIds.length) {
    conditions.push(inArray(schema.socialQueue.id, queueIds))
  }
  if (platform) {
    conditions.push(eq(schema.socialQueue.platform, platform as any))
  }

  const retried = await db.update(schema.socialQueue)
    .set({
      status: 'queued',
      lastError: null,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(and(...conditions))
    .returning({ id: schema.socialQueue.id, platform: schema.socialQueue.platform, status: schema.socialQueue.status })

  return {
    success: true,
    data: retried,
    count: retried.length,
  }
})
