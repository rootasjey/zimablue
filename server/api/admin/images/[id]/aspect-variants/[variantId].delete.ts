import { db } from 'hub:db'
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

  const existing = await db.select().from(images).where(eq(images.id, variantImageId)).get()
  if (!existing) throw createError({ statusCode: 404, message: 'Variant image not found' })

  // Unlink the variant
  await db.update(images)
    .set({
      aspectGroupId: null,
      aspectLabel: '',
    })
    .where(eq(images.id, variantImageId))

  return { success: true }
})
