import { VariantType } from "~/types/image"
import { z } from 'zod'

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

  const dbResponse = await hubDatabase()
  .prepare(`
    SELECT * 
    FROM images
    WHERE id = ?1
  `)
  .bind(id)
  .run()

  // return {
  //   ok: true,
  // }

  await hubDatabase()
  .prepare(`
    DELETE FROM images
    WHERE id = ?1
  `)
  .bind(id)
  .run()

  if (!dbResponse.success) {
    throw createError({
      statusCode: 500,
      message: 'Failed to delete image from database',
    })
  }

  const imageData = dbResponse.results[0]
  console.log('0. get image data : id', id)
  
  // Parse variants
  const variants: Array<VariantType> = JSON.parse(imageData.variants as string || '[]')

  // Delete all variants
  for (const variant of variants) {
  console.log('0. delete blob: variant', variant.pathname)
    await hubBlob().del(variant.pathname)
  }

  return {
    ...imageData,
    ok: true,
  }
})
