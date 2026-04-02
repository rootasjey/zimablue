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

  if (queueIds.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'At least two queue ids are required' })
  }

  const platform = String(body?.platform || '')
  if (!platform) {
    throw createError({ statusCode: 400, statusMessage: 'platform is required' })
  }

  const rows = await db.select({ id: schema.socialQueue.id, platform: schema.socialQueue.platform })
    .from(schema.socialQueue)
    .where(inArray(schema.socialQueue.id, queueIds))

  if (rows.length !== queueIds.length || rows.some(row => row.platform !== platform)) {
    throw createError({ statusCode: 400, statusMessage: 'Queue ids must all exist on the same platform' })
  }

  await Promise.all(queueIds.map((queueId: number, index: number) => {
    return db.update(schema.socialQueue)
      .set({
        position: index + 1,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(eq(schema.socialQueue.id, queueId), eq(schema.socialQueue.platform, platform as any)))
  }))

  return {
    success: true,
    data: queueIds.map((id: number, index: number) => ({ id, position: index + 1 })),
  }
})
