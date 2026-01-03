import { db } from 'hub:db'
import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import type { Image } from '~~/shared/types/image'
import { images } from '../../../db/schema'

export default eventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  const image = await db.select()
    .from(images)
    .where(eq(images.id, Number(id)))
    .get()

  if (!image) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  await db.update(images)
    .set({ statsViews: sql`${images.statsViews} + 1` })
    .where(eq(images.id, Number(id)))

  return image as unknown as Image
})