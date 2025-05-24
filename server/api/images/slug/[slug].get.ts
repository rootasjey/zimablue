import { z } from 'zod'
import { Image } from '~/types/image'

export default eventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, z.object({
    slug: z.string().min(1)
  }).parse)

  const dbResponse = await hubDatabase()
    .prepare(`
      SELECT *
      FROM images
      WHERE slug = ?1
    `)
    .bind(slug)
    .run()

  if (!dbResponse.success || dbResponse.results.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  // Update view count
  await hubDatabase()
    .prepare(`
      UPDATE images
      SET stats_views = stats_views + 1
      WHERE slug = ?1
    `)
    .bind(slug)
    .run()

  return dbResponse.results[0] as unknown as Image
})