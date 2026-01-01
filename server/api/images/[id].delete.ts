import { db } from '~/server/utils/database'
import type { VariantType } from "~/types/image"
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  await requireUserSession(event)
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

  const imageData = await db.get(sql`
    SELECT * 
    FROM images
    WHERE id = ${id}
  `)

  if (!imageData) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  console.log('0. get image data : id', id)
  
  // Parse variants
  const variants: Array<VariantType> = JSON.parse(imageData.variants as string || '[]')

  // Delete all variants from blob storage
  for (const variant of variants) {
    console.log('0. delete blob: variant', variant.pathname)
    await blob.del(variant.pathname)
  }

  // Delete from database
  await db.run(sql`
    DELETE FROM images
    WHERE id = ${id}
  `)

  return {
    ...imageData,
    ok: true,
  }
})
