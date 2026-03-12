import { db } from 'hub:db'
import { images } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)

  // Admin check
  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

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
      console.warn('grid/save: removed unknown image IDs from layout before saving')
    }

    // Update grid positions (x, y, w, h) in D1 for each image
    for (const item of filteredBody) {
      if (item.id) {
        await db.update(images)
          .set({
            x: item.x ?? 0,
            y: item.y ?? 0,
            w: item.w ?? 6,
            h: item.h ?? 6,
            updatedAt: new Date()
          })
          .where(eq(images.id, item.id))
      }
    }
  } catch (err) {
    console.error('Failed to save grid layout to database:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save grid layout' })
  }

  return {
    success: true,
    message: 'Grid layout saved successfully'
  }
})
