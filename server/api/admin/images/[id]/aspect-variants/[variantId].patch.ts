import { db } from 'hub:db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { images } from '../../../../../db/schema'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { variantId } = getRouterParams(event)
  const variantImageId = Number(variantId)
  if (!variantImageId) throw createError({ statusCode: 400, message: 'Invalid variant ID' })

  const body = await readBody(event)
  const { label } = body

  if (!label) throw createError({ statusCode: 400, message: 'label is required' })

  const ASPECT_LABELS = ['Portrait', 'Paysage', 'Carré']
  if (!ASPECT_LABELS.includes(label)) {
    throw createError({ statusCode: 400, message: `Label must be one of: ${ASPECT_LABELS.join(', ')}` })
  }

  const existing = await db.select().from(images).where(eq(images.id, variantImageId)).get()
  if (!existing) throw createError({ statusCode: 404, message: 'Variant image not found' })

  await db.update(images)
    .set({ aspectLabel: label })
    .where(eq(images.id, variantImageId))

  return { success: true }
})
