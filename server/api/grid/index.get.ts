import type { Image } from "~~/shared/types/image"
import { kv } from 'hub:kv'

export default eventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  const layout = await kv.get('grid:main') ?? []
  return layout as Image[]
})
