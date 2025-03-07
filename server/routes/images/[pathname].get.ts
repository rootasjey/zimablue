import Sharp from 'sharp'
import { z } from 'zod'

/**
 * Handles the GET request for the `/images/{pathname}` route. 
 * This function retrieves an image from blob storage, 
 * applies any requested transformations (e.g. resizing, format conversion), 
 * and returns the transformed image.
 * The result is cached for 1 hour.
 * If the requested image is not found in blob storage, a 404 error is thrown.
 */
export default cachedEventHandler(async (event) => {
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
}, {
  getKey: (event) => {
    const { pathname } = getRouterParams(event)
    return `images:${pathname}`
  },
  maxAge: 60 * 60 * 1, // 1 hour
})
