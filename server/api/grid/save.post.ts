export default eventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readBody(event)

  await hubKV().set('grid:main', body)

  return {
    success: true,
    message: 'Grid layout saved successfully'
  }
})
