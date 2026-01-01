import { db } from '~/server/utils/database'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import type { Image } from '~/types/image'

export default eventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, z.object({
    slug: z.string().min(1)
  }).parse)

  const image = await db.get(sql`
    SELECT *
    FROM images
    WHERE slug = ${slug}
  `)

  if (!image) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  // Update view count
  await db.run(sql`
    UPDATE images
    SET stats_views = stats_views + 1
    WHERE slug = ${slug}
  `)

  return image as unknown as Image
})