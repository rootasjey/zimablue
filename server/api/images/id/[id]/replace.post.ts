import { db } from 'hub:db'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import type { Image, VariantType } from '~~/shared/types/image'
import { Jimp } from 'jimp'
import { generateUniquePathname } from '../../utils/generateUniquePathname'
import { blob } from 'hub:blob'
import { images } from '../../../../db/schema'
import { generateImageVariants } from '../../../../utils/generateImageVariants'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  
  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }
  
  const userId = session.user.id

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  // Get existing image entry
  const existingImage = await db.select()
    .from(images)
    .where(eq(images.id, Number(id)))
    .get() as unknown as Image | null

  if (!existingImage) {
    throw createError({
      statusCode: 404,
      message: 'Image not found',
    })
  }

  // Read form data for new image
  const formData = await readMultipartFormData(event)
  const file = formData?.find(item => item.name === 'file')?.data
  const fileName = formData?.find(item => item.name === 'fileName')?.data.toString()
  const type = formData?.find(item => item.name === 'type')?.data.toString()

  if (!file || !fileName || !type) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields',
    })
  }

  // Check if the file is an image
  if (type !== 'image/jpeg' && type !== 'image/png' && type !== 'image/bmp' 
    && type !== 'image/tiff' && type !== 'image/x-ms-bmp' && type !== 'image/gif') {
    throw createError({
      statusCode: 400,
      message: 'File must be an image',
    })
  }

  let oldVariants: VariantType[] = []
  try { // Delete old blob files
    oldVariants = typeof existingImage.variants === 'string' ? JSON.parse(existingImage.variants) : existingImage.variants
    for (const variant of oldVariants) {
      if (variant.pathname) {
        await blob.del(variant.pathname)
      }
    }
  } catch (error) {
    console.error('Error deleting old image files:', error)
    // Continue with replacement even if deletion fails
  }

  // Create a unique ID for the image folder (reuse existing prefix if possible)
    const extension = type.split('/')[1] || 'jpg'
    const baseName = fileName.substring(0, fileName.lastIndexOf('.'))
    const imagePrefix = existingImage.pathname && existingImage.pathname.includes('/')
    ? existingImage.pathname
    : await generateUniquePathname(baseName, extension || 'jpg')

  // Process the original image with Jimp
  const originalImage = await Jimp.fromBuffer(file)

  // Upload original image
  const originalBuffer = await originalImage.getBuffer(type)
  const originalBlob = new Blob([new Uint8Array(originalBuffer)], { type })
  
  const originalResponse = await blob.put(`${imagePrefix}/original.${extension}`, originalBlob, {
    addRandomSuffix: false,
  })

  const generatedVariants = await generateImageVariants({
    image: originalImage,
    imagePrefix,
    originalPath: originalResponse.pathname,
    extension,
    mimeType: type,
  })

  // Update database entry with new variants
  const updateResponse = await db.update(images)
    .set({
      pathname: imagePrefix,
      variants: JSON.stringify(generatedVariants),
      updatedAt: new Date()
    })
    .where(eq(images.id, Number(id)))
    .returning()
    .get()

  return {
    success: true,
    results: [updateResponse],
  }
})
