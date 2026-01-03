import { kv } from 'hub:kv'
import { db } from 'hub:db'
import { images } from '../../db/schema'

export default eventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readBody(event) as any[]

  try {
    // Remove any layout items referencing images that no longer exist in the DB
    const bodyIds = body.map((item: any) => Number(item?.id)).filter((id: number) => Number.isFinite(id))
    const existing = await db.select({ id: images.id }).from(images).all()
    const existingIds = new Set(existing.map(e => e.id))

    const filteredBody = body.filter((item: any) => {
      const id = Number(item?.id)
      // Keep items without an id (e.g., placeholders) or items with existing image ids
      return !id || existingIds.has(id)
    })

    if (filteredBody.length !== body.length) {
      console.warn('grid/save: removed unknown image IDs from layout before saving to KV')
    }

    await kv.set('grid:main', filteredBody)
  } catch (err) {
    console.warn('Failed to validate or save grid layout to KV store:', err)
    // Fallback: attempt to write the provided body to KV to avoid data loss
    try {
      await kv.set('grid:main', body)
    } catch (kvErr) {
      console.error('Failed to write grid layout to KV:', kvErr)
      throw createError({ statusCode: 500, statusMessage: 'Failed to save grid layout' })
    }
  }

  return {
    success: true,
    message: 'Grid layout saved successfully'
  }
})
