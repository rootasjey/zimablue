import { db } from 'hub:db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { blob } from 'hub:blob'
import { images } from '../../db/schema'
import type { VariantType } from '~~/shared/types/image'

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

  const variants: VariantType[] = JSON.parse((imageData as any).variants)
  const original = variants.find(v => v.size === 'original') || variants.find(v => v.size === 'lg')

  if (!original) {
    throw createError({
      statusCode: 404,
      message: 'Image variant not found',
    })
  }

  return blob.serve(event, original.pathname)
})
