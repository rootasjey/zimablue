import { db } from 'hub:db'
import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import type { Image } from '~~/shared/types/image'
import { images } from '../../../db/schema'
import { keysToSnake } from '../../../utils/case'

export default eventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  // Increment and return the updated image
  const image = await db.update(images)
    .set({ statsViews: sql`${images.statsViews} + 1` })
    .where(eq(images.id, Number(id)))
    .returning()
    .get()

  if (!image) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  return keysToSnake(image) as unknown as Image
})