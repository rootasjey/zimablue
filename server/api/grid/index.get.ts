import { Image } from "~/types/image"

export default eventHandler(async (event) => {
  const layout = await hubKV().get('grid:main') ?? []
  return layout as Image[]
})
