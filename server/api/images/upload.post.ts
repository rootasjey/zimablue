export default eventHandler(async (event) => {
  await requireUserSession(event)

  const formData = await readMultipartFormData(event)
  const file = formData?.find(item => item.name === 'file')?.data
  const fileName = formData?.find(item => item.name === 'fileName')?.data.toString()
  const type = formData?.find(item => item.name === 'type')?.data.toString()
  const x = formData?.find(item => item.name === 'x')?.data.toString()
  const y = formData?.find(item => item.name === 'y')?.data.toString()
  const w = formData?.find(item => item.name === 'w')?.data.toString()
  const h = formData?.find(item => item.name === 'h')?.data.toString()
  const id = formData?.find(item => item.name === 'id')?.data.toString()
  
  if (!file || !fileName || !type) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields',
    })
  }

  const blob = new Blob([file], { type })
  const blobResponse = await hubBlob().put(fileName, blob, {
    addRandomSuffix: true,
    prefix: 'images',
  })

  const pathname = blobResponse.pathname
  const insertResponse = await hubDatabase()
    .prepare(`
      INSERT INTO images (name, pathname, x, y, w, h, id)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
    `)
    .bind(pathname, pathname, x, y, w, h, id)
    .run()

  if (!insertResponse.success) {
    throw createError({
      statusCode: 500,
      message: 'Failed to insert image into database',
    })
  }

  const selectResponse = await hubDatabase()
  .prepare(`
    SELECT * FROM images
    WHERE id = ?1
  `)
  .bind(insertResponse.meta.last_row_id)
  .run()

  return {
    ...selectResponse,
    ok: true,
  }
})
