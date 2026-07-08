import { db } from 'hub:db'
import { eq } from 'drizzle-orm'
import { images } from '../../../../../db/schema'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { id } = getRouterParams(event)
  const currentPrimaryId = Number(id)
  if (!currentPrimaryId) throw createError({ statusCode: 400, message: 'Invalid primary image ID' })

  const body = await readBody(event)
  const { newPrimaryId } = body
  if (!newPrimaryId) throw createError({ statusCode: 400, message: 'newPrimaryId is required' })

  if (newPrimaryId === currentPrimaryId) {
    throw createError({ statusCode: 400, message: 'Cannot promote an image to be its own primary' })
  }

  // Verify the current primary exists
  const currentPrimary = await db.select().from(images).where(eq(images.id, currentPrimaryId)).get()
  if (!currentPrimary) throw createError({ statusCode: 404, message: 'Current primary image not found' })

  // Verify the new primary exists and is a variant of the current primary
  const newPrimary = await db.select().from(images).where(eq(images.id, newPrimaryId)).get()
  if (!newPrimary) throw createError({ statusCode: 404, message: 'New primary image not found' })
  if (newPrimary.aspectGroupId !== currentPrimaryId) {
    throw createError({ statusCode: 400, message: 'The new primary must be a variant of the current primary' })
  }

  // If the current primary doesn't have a label, default to 'Portrait'
  if (!currentPrimary.aspectLabel) {
    await db.update(images)
      .set({ aspectLabel: 'Portrait' })
      .where(eq(images.id, currentPrimaryId))
  }

  // Get all variants that point to the current primary (excluding the new primary)
  const otherVariants = await db.select()
    .from(images)
    .where(eq(images.aspectGroupId, currentPrimaryId))
    .all()

  // Demote old primary: make it a variant of the new primary
  await db.update(images)
    .set({
      aspectGroupId: newPrimaryId,
    })
    .where(eq(images.id, currentPrimaryId))

  // Promote new primary: clear its aspect_group_id
  await db.update(images)
    .set({
      aspectGroupId: null,
    })
    .where(eq(images.id, newPrimaryId))

  // Re-parent all other variants to point to the new primary
  for (const variant of otherVariants) {
    if (variant.id === newPrimaryId) continue
    await db.update(images)
      .set({ aspectGroupId: newPrimaryId })
      .where(eq(images.id, variant.id))
  }

  return { success: true }
})
