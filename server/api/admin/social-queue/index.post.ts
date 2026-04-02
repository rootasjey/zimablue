import { db, schema } from 'hub:db'
import { eq, inArray, sql } from 'drizzle-orm'
import { isAdminSession } from '../../../utils/auth'
import { getSocialAutopostPlatformError, isSocialAutopostPlatform } from '../../../utils/social-autopost'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const imageIds = Array.isArray(body?.imageIds)
    ? body.imageIds.map((value: unknown) => Number(value)).filter((value: number) => Number.isInteger(value) && value > 0)
    : []

  if (!imageIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'imageIds is required' })
  }

  const platform = String(body?.platform || 'bluesky')
  if (!isSocialAutopostPlatform(platform)) {
    throw createError({ statusCode: 400, statusMessage: getSocialAutopostPlatformError() })
  }

  const scheduledFor = body?.scheduledFor ? new Date(String(body.scheduledFor)) : null
  if (scheduledFor && Number.isNaN(scheduledFor.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid scheduledFor value' })
  }

  const validImages = await db.select({ id: schema.images.id })
    .from(schema.images)
    .where(inArray(schema.images.id, imageIds))

  const validImageIds = imageIds.filter((imageId: number) => validImages.some(image => image.id === imageId))
  if (!validImageIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'No valid images found' })
  }

  const maxPositionRows = await db.select({
    maxPosition: sql<number>`COALESCE(MAX(${schema.socialQueue.position}), 0)`
  })
    .from(schema.socialQueue)
    .where(eq(schema.socialQueue.platform, platform))

  const basePosition = Number(maxPositionRows[0]?.maxPosition || 0)
  const values = validImageIds.map((imageId: number, index: number) => ({
    imageId,
    sourceType: 'image',
    sourceId: imageId,
    platform,
    status: 'queued' as const,
    position: basePosition + index + 1,
    scheduledFor: scheduledFor || undefined,
  }))

  const inserted = await db.insert(schema.socialQueue)
    .values(values)
    .onConflictDoNothing({
      target: [schema.socialQueue.imageId, schema.socialQueue.platform],
    })
    .returning({
      id: schema.socialQueue.id,
      imageId: schema.socialQueue.imageId,
      sourceType: schema.socialQueue.sourceType,
      sourceId: schema.socialQueue.sourceId,
      platform: schema.socialQueue.platform,
      position: schema.socialQueue.position,
      status: schema.socialQueue.status,
    })

  return {
    success: true,
    data: inserted,
    count: inserted.length,
  }
})