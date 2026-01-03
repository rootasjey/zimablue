import type { Image } from "~~/shared/types/image"
import { kv } from 'hub:kv'

export default eventHandler(async (event) => {
  const layout = await kv.get('grid:main') ?? []
  return layout as Image[]
})
