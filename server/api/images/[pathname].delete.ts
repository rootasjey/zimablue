export default eventHandler(async (event) => {
  await requireUserSession(event)
  const { pathname } = event.context.params || {}

  if (!pathname) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields',
    })
  }

  const dbResponse = await hubDatabase()
  .prepare(`
    SELECT * 
    FROM images
    WHERE id = ?1
  `)
  .bind(pathname)
  .run()

  await hubDatabase()
  .prepare(`
    DELETE FROM images
    WHERE id = ?1
  `)
  .bind(pathname)
  .run()

  if (!dbResponse.success) {
    throw createError({
      statusCode: 500,
      message: 'Failed to delete image from database',
    })
  }

  const blobPathname = dbResponse.results[0].pathname as string
  return hubBlob().del(blobPathname)
})