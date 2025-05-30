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

  if (!dbResponse.success || dbResponse.results.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  await hubDatabase()
    .prepare(`
      UPDATE images
      SET stats_views = stats_views + 1
      WHERE id = ?1
    `)
    .bind(id)
    .run()

  return dbResponse.results[0] as unknown as Image
})