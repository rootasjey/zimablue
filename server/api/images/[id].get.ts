import { db } from '~/server/utils/database'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  const imageData = await db.get(sql`
    SELECT * 
    FROM images
    WHERE id = ${id}
  `)

  if (!imageData) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  const imagePathname = `images/${imageData.pathname}`
  return blob.serve(event, imagePathname)
})
