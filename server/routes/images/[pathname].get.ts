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

  // Convert query object to string
  const queryString = 
    Object.entries(query).length > 0
    ? ":" + Object.entries(query).map(([key, value]) => `${key}=${value}`).join('&')
    : ""

  // Get image from blob storage
  const imagePathname = `images/${pathname}`
  const cacheKey = `imagecache:${pathname}${queryString}`

  // Try to get from cache first
  const cachedImage = await hubKV().get(cacheKey) as Record<string, any> | null | undefined
  if (cachedImage) {
    const imageBuffer = Buffer.from(cachedImage.buffer, 'base64') // Convert back to buffer
    setHeader(event, 'Cache-Control', 'public, max-age=1800')
    setHeader(event, 'Content-Type', cachedImage.type)
    return imageBuffer
  }
  
  // If not in cache, get from blob storage
  const blob = await hubBlob().get(imagePathname)
  if (!blob) { throw createError({ statusCode: 404, message: 'Image not found' }) }

  const image = await Jimp.fromBuffer(await blob.arrayBuffer())
  const mimeType = format ?? blob.type ?? `image/${pathname.split('.').pop()}`
  let imageBuffer: Buffer

  if (width || height) {
    await image.resize({
      w: width,
      h: height ?? width ?? 360,
    })
  }

  imageBuffer = format 
    ? await image.getBuffer(format, {
        quality,
      } as any)
    : await image.getBuffer(mimeType as any)

  if (!format && quality > -1) {
    console.warn(`⚠️ (server) ${pathname} \n • Specify an output format to apply quality`)
  }

  // Store in cache with 1 hour TTL
  await hubKV().set(cacheKey, {
    buffer: Buffer.from(imageBuffer).toString('base64'), // Convert to base64 string
    type: mimeType,
  }, {
    ttl: 60 * 60 // 1 hour in seconds
  })

  setHeader(event, 'Cache-Control', 'public, max-age=1800')
  setHeader(event, 'Content-Type', mimeType)
  return imageBuffer
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
