import { z } from 'zod'
import { VariantType } from '~/types/image'

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

  const query = getQuery(event)
  const requestedWidth = query.width ? parseInt(query.width as string) : undefined
  // const requestedHeight = query.height ? parseInt(query.height as string) : undefined

  // Check if this is a request for a pre-generated variant
  // Extract the image ID and variant from the pathname if it follows our new pattern
  const pathParts = pathname.split('/')
  const imageId = pathParts[0]
  const variantRequested = pathParts.length > 1 ? pathParts[1].split('.')[0] : null

  // If a specific variant is requested, try to serve it directly
  if (variantRequested) {
    const fullPath = `images/${pathname}`
    const blob = await hubBlob().get(fullPath)
    
    if (blob) {
      const buffer = Buffer.from(await blob.arrayBuffer())
      setHeader(event, 'Content-Type', blob.type)
      return buffer
    }
  }
  
  // Check if we have pre-generated variants for this image
  const imageData = await hubDatabase()
    .prepare(`SELECT * FROM images WHERE pathname = ? LIMIT 1`)
    .bind(`images/${pathname}`)
    .first()

  if (!imageData || typeof imageData.variants !== 'string') {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  const variants: Array<VariantType> = JSON.parse(imageData.variants)

  // Find the best matching variant based on requested width
  if (requestedWidth) {
    // Find the smallest variant that is larger than or equal to the requested width
    const suitableVariants = variants
      .filter((v) => v.width >= requestedWidth)
      .sort((a, b) => a.width - b.width)
    
    if (suitableVariants.length > 0) {
      const bestVariant = suitableVariants[0]
      const blob = await hubBlob().get(bestVariant.pathname)
      
      if (blob) {
        const buffer = Buffer.from(await blob.arrayBuffer())
        setHeader(event, 'Content-Type', blob.type)
        return buffer
      }
    }
  }

  const largeVariant = variants.find(v => v.size === 'lg')
  if (largeVariant) {
    const blob = await hubBlob().get(largeVariant.pathname)
    if (blob) {
      const buffer = Buffer.from(await blob.arrayBuffer())
      setHeader(event, 'Content-Type', blob.type)
      return buffer
    }
  }
})
