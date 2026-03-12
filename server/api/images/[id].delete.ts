import { db } from 'hub:db'
import type { VariantType } from "~~/shared/types/image"
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { blob } from 'hub:blob'
import { images } from '../../db/schema'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  
  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }
  
  // const pathname = getRouterParam(event, 'pathname')
  const id = getRouterParam(event, 'id')
  // const { pathname } = await getValidatedRouterParams(event, z.object({
  //     pathname: z.string().min(1)
  //   }).parse)

  // console.log('0. delete : pathname', pathname, ` • id`, id)
  console.log(`0. delete : id:`, id)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields',
    })
  }

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

  console.log('0. get image data : id', id)
  
  // Parse variants
  const variants: Array<VariantType> = JSON.parse((imageData as any).variants as string || '[]')

  // Delete all variants from blob storage
  for (const variant of variants) {
    console.log('0. delete blob: variant', variant.pathname)
    await blob.del(variant.pathname)
  }

  // Delete from database
  await db.delete(images)
    .where(eq(images.id, Number(id)))

  return {
    ...imageData,
    ok: true,
  }
})
