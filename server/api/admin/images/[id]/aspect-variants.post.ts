import { db } from 'hub:db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { images } from '../../../../db/schema'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { id } = getRouterParams(event)
  const primaryId = Number(id)
  if (!primaryId) throw createError({ statusCode: 400, message: 'Invalid image ID' })

  const body = await readBody(event)
  const { variantImageId, label } = body

  if (!variantImageId || !label) {
    throw createError({ statusCode: 400, message: 'variantImageId and label are required' })
  }

  const ASPECT_LABELS = ['Portrait', 'Paysage', 'Carré']
  if (!ASPECT_LABELS.includes(label)) {
    throw createError({ statusCode: 400, message: `Label must be one of: ${ASPECT_LABELS.join(', ')}` })
  }

  // Verify the primary image exists
  const primary = await db.select().from(images).where(eq(images.id, primaryId)).get()
  if (!primary) throw createError({ statusCode: 404, message: 'Primary image not found' })

  // Verify the variant image exists
  const variant = await db.select().from(images).where(eq(images.id, variantImageId)).get()
  if (!variant) throw createError({ statusCode: 404, message: 'Variant image not found' })

  if (variantImageId === primaryId) {
    throw createError({ statusCode: 400, message: 'Cannot add an image as a variant of itself' })
  }

  if (variant.aspectGroupId !== null) {
    throw createError({ statusCode: 400, message: 'This image is already linked to another aspect group. Unlink it first.' })
  }

  // If the primary doesn't have a label yet, default to 'Portrait'
  if (!primary.aspectLabel) {
    await db.update(images)
      .set({ aspectLabel: 'Portrait' })
      .where(eq(images.id, primaryId))
  }

  // Link the variant to the primary
  await db.update(images)
    .set({
      aspectGroupId: primaryId,
      aspectLabel: label,
    })
    .where(eq(images.id, variantImageId))

  return { success: true }
})
