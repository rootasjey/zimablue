export default eventHandler(async (event) => {
  await requireUserSession(event)

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

  const blob = new Blob([file], { type })
  const uploadedBlob = await hubBlob().put(fileName, blob, {
    addRandomSuffix: true,
    prefix: 'images',
  })

  return {
    image: uploadedBlob,
    ok: true,
  }
})