import { db } from '~/server/utils/database'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import type { Image } from '~/types/image'

export default eventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  const image = await db.get(sql`
    SELECT *
    FROM images
    WHERE id = ${id}
  `)

  if (!image) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  await db.run(sql`
    UPDATE images
    SET stats_views = stats_views + 1
    WHERE id = ${id}
  `)

  return image as unknown as Image
})