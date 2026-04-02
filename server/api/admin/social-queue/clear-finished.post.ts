import { db, schema } from 'hub:db'
import { and, eq, inArray } from 'drizzle-orm'
import { isAdminSession } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const statuses = Array.isArray(body?.statuses) && body.statuses.length
    ? body.statuses.map((value: unknown) => String(value)).filter((value: string) => value === 'posted' || value === 'failed')
    : ['posted', 'failed']

  if (!statuses.length) {
    throw createError({ statusCode: 400, statusMessage: 'statuses must contain posted or failed' })
  }

  const platform = body?.platform ? String(body.platform) : undefined
  const conditions = [inArray(schema.socialQueue.status, statuses as Array<'posted' | 'failed'>)]
  if (platform) {
    conditions.push(eq(schema.socialQueue.platform, platform as any))
  }

  const deleted = await db.delete(schema.socialQueue)
    .where(and(...conditions))
    .returning({ id: schema.socialQueue.id })

  return {
    success: true,
    count: deleted.length,
    data: deleted,
  }
})
