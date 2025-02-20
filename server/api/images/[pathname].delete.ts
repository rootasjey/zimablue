export default eventHandler(async (event) => {
  await requireUserSession(event)
  const { pathname } = event.context.params || {}
  const blobPath = `images/${pathname}`
  return hubBlob().del(blobPath)
})