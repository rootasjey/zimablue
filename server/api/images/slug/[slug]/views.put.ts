// PUT /api/images/slug/:slug/views

import { z } from 'zod'
import { Image } from '~/types/image'

export default eventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, z.object({
    slug: z.string().min(1)
  }).parse)

  const updateResponse = await hubDatabase()
    .prepare(`
      UPDATE images
      SET stats_views = stats_views + 1
      WHERE slug = ?1
    `)
    .bind(slug)
    .run()

  if (!updateResponse.success) {
    throw createError({
      statusCode: 500,
      message: 'Failed to update view count',
    })
  }

  const image = await hubDatabase()
  .prepare(`
    SELECT * FROM images
    WHERE slug = ?1
  `)
  .bind(slug)
  .run()
  .then(res => res.results[0])

  return image as unknown as Image
})