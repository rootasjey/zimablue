import Sharp from 'sharp'
import { z } from 'zod'


export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const query = getQuery(event) // Get query parameters for transformations
  const width = query.width ? parseInt(query.width as string) : undefined
  const height = query.height ? parseInt(query.height as string) : undefined
  const format = query.format ? query.format as string : undefined
  const fit = query.fit ? query.fit as keyof Sharp.FitEnum : undefined
  const quality = query.quality ? parseInt(query.quality as string) : 100
  
  // Get image from blob storage
  const imagePathname = `images/${pathname}`
  const blob = await hubBlob().get(imagePathname)
  
  if (!blob) {
    throw createError({ statusCode: 404, message: 'Image not found' })
  }

  let pipeline = Sharp(await blob.arrayBuffer()) // Create Sharp instance

  // Apply transformations based on query parameters
  if (width || height) {
    pipeline = pipeline.resize({
      width,
      height,
      fit: fit || 'cover',
    })
  }

  if (format) {
    pipeline = pipeline.toFormat(format as keyof Sharp.FormatEnum, {
      quality,
    })
  }

  const transformedImage = await pipeline.toBuffer()
  const imgExt = format ?? pathname.split('.').pop()

  setHeader(event, 'Content-Type', `image/${imgExt || 'jpeg'}`)
  return transformedImage
})
