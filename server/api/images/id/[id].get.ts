import { z } from 'zod'
import { Image } from '~/types/image'

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
      message: 'Failed to get image from database',
    })
  }

  if (!dbResponse.results.length) {
    throw createError({ statusCode: 404, message: '(database) Image not found' })
  }

  return dbResponse.results[0] as unknown as Image
})