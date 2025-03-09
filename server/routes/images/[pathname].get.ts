import { Jimp } from 'jimp'
import { z } from 'zod'

/**
 * Handles the GET request for the `/images/{pathname}` route. 
 * This function retrieves an image from blob storage, 
 * applies any requested transformations (e.g. resizing, format conversion), 
 * and returns the transformed image.
 * If the requested image is not found in blob storage, a 404 error is thrown.
 */
export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const query = getQuery(event) // Get query parameters for transformations
  const width = query.width ? parseInt(query.width as string) : undefined
  const height = query.height ? parseInt(query.height as string) : undefined
  const format = getFormat(query.format ? query.format as string : undefined)
  const quality = query.quality ? parseInt(query.quality as string) : -1

  // Get image from blob storage
  const imagePathname = `images/${pathname}`
  const blob = await hubBlob().get(imagePathname)
  
  if (!blob) {
    throw createError({ statusCode: 404, message: 'Image not found' })
  }

  const imageBuffer = await Jimp.fromBuffer(await blob.arrayBuffer())

  if (width || height) {
    imageBuffer.resize({
      w: width,
      h: height ?? width ?? 360,
    })
  }

  if (format) {
    imageBuffer.getBuffer(format, {
      quality,
    } as any)
  }

  if (!format && quality > -1) {
    console.warn(`⚠️ (server) ${pathname} \n • Specify an output format to apply quality`)
  }

  const mimeType = format ?? blob.type ?? `image/${pathname.split('.').pop()}`
  setHeader(event, 'Cache-Control', 'public, max-age=1800')
  setHeader(event, 'Content-Type', mimeType)
  return imageBuffer.getBuffer(mimeType as any)
})

function getFormat(format?: string) {
  if (!format) return undefined
  if (format === 'bmp') return 'image/bmp'
  if (format === 'gif') return 'image/gif'
  if (format === 'jpg') return 'image/jpeg'
  if (format === 'jpeg') return 'image/jpeg'
  if (format === 'png') return 'image/png'
  if (format === 'tiff') return 'image/tiff'
}
