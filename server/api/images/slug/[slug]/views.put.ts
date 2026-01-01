// PUT /api/images/slug/:slug/views

import { db } from '~/server/utils/database'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import type { Image } from '~/types/image'

export default eventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, z.object({
    slug: z.string().min(1)
  }).parse)

  const image = await db.get(sql`
    UPDATE images
    SET stats_views = stats_views + 1
    WHERE slug = ${slug}
    RETURNING *
  `)

  if (!image) {
    throw createError({
      statusCode: 500,
      message: 'Failed to update view count',
    })
  }

  return image as unknown as Image
})