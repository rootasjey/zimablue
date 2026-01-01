import { kv } from 'hub:kv'

export default eventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readBody(event)

  await kv.set('grid:main', body)

  return {
    success: true,
    message: 'Grid layout saved successfully'
  }
})
