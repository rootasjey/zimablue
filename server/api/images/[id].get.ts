import { z } from 'zod'

export default eventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  const dbResponse = await hubDatabase()
  .prepare(`
    SELECT * 
    FROM images
    WHERE id = ?1
  `)
  .bind(id)
  .run()

  if (!dbResponse.success) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch image from database',
    })
  }

  const imageData = dbResponse.results[0]
  if (!imageData) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  const imagePathname = `images/${imageData.pathname}`
  return hubBlob().serve(event, imagePathname)
})
