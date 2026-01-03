import { db } from 'hub:db'
import { images } from '../../../db/schema'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session?.user || session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  // Fetch image ids
  const rows = await db.select({ id: images.id })
    .from(images)
    .orderBy(images.id)
    .all()
  const ids = rows.map(r => r.id)

  // Sequentially call the single-image regenerate handler to reuse logic
  let processed = 0
  for (const id of ids) {
    try {
      await $fetch(`/api/admin/images/${id}/regenerate`, { method: 'POST' as any })
      processed++
    } catch (e) {
      // continue
    }
  }

  return { success: true, total: ids.length, processed }
})
