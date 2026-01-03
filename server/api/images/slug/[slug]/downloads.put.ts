// PUT /api/images/slug/:slug/downloads

import { db } from 'hub:db'
import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import type { Image } from '~~/shared/types/image'
import { images } from '../../../../db/schema'

export default eventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, z.object({
    slug: z.string().min(1)
  }).parse)

  const image = await db.update(images)
    .set({ statsDownloads: sql`${images.statsDownloads} + 1` })
    .where(eq(images.slug, slug))
    .returning()
    .get()

  if (!image) {
    throw createError({
      statusCode: 500,
      message: 'Failed to update download count',
    })
  }

  return image as unknown as Image
})