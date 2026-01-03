import { db } from 'hub:db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { blob } from 'hub:blob'
import { images } from '../../db/schema'

export default eventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  const imageData = await db.select()
    .from(images)
    .where(eq(images.id, Number(id)))
    .get()

  if (!imageData) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  const imagePathname = `images/${(imageData as any).pathname}`
  return blob.serve(event, imagePathname)
})
