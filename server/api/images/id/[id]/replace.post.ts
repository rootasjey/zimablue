import { z } from 'zod'
import { Image } from '~/types/image'

export default eventHandler(async (event) => {
  await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  // Get existing image entry
  const existingImage = await hubDatabase()
    .prepare(`
      SELECT * FROM images
      WHERE id = ?1
    `)
    .bind(id)
    .first()

  if (!existingImage || typeof existingImage.pathname !== "string") {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  // Read form data for new image
  const formData = await readMultipartFormData(event)
  const file = formData?.find(item => item.name === 'file')?.data
  const fileName = formData?.find(item => item.name === 'fileName')?.data.toString()
  const type = formData?.find(item => item.name === 'type')?.data.toString()

  if (!file || !fileName || !type) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields',
    })
  }

  // Delete old blob
  await hubBlob().delete(existingImage.pathname)

  // Upload new blob
  const blob = new Blob([file], { type })
  const blobResponse = await hubBlob().put(fileName, blob, {
    addRandomSuffix: true,
    prefix: 'images',
  })

  // Update database entry
  const updateResponse = await hubDatabase()
    .prepare(`
      UPDATE images 
      SET pathname = ?1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?2
      RETURNING *
    `)
    .bind(blobResponse.pathname, id)
    .first()

  // Update grid layout
  const layout = (await hubKV().get('grid:main') ?? []) as Image[]
  const updatedLayout = layout.map((item) => {
    if (item.id === parseInt(id)) {
      return {
        ...item,
        pathname: blobResponse.pathname,
      }
    }

    return item
  })

  await hubKV().set('grid:main', updatedLayout)

  return {
    success: true,
    results: [updateResponse],
  }
})
