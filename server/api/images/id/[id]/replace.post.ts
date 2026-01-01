import { db } from '~/server/utils/database'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import type { Image, VariantType } from '~/types/image'
import { Jimp } from 'jimp'
import { generateUniquePathname } from '~/server/api/images/utils/generateUniquePathname'
import { blob } from 'hub:blob'
import { kv } from 'hub:kv'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  // Get existing image entry
  const existingImage: Image | null = await db.get(sql`
    SELECT * FROM images
    WHERE id = ${id}
  `)

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

  try { // Delete old blob files
    const variants = typeof existingImage.variants === 'string' ? JSON.parse(existingImage.variants) : existingImage.variants
    for (const variant of variants) {
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

  const sizes = [
    { width: 160, suffix: 'xxs' },
    { width: 320, suffix: 'xs' },
    { width: 640, suffix: 'sm' },
    { width: 1024, suffix: 'md' },
    { width: 1920, suffix: 'lg' },
    // Original size will be stored as 'original'
  ]
  
  // Store all generated pathnames
  const generatedVariants: Array<VariantType> = []
  
  // Upload original image
  const originalBuffer = await originalImage.getBuffer(type)
  const originalBlob = new Blob([new Uint8Array(originalBuffer)], { type })
  
  const originalResponse = await blob.put(`${imagePrefix}/original.${extension}`, originalBlob, {
    addRandomSuffix: false,
  })

  generatedVariants.push({
    size: 'original',
    width: originalImage.width,
    height: originalImage.height,
    pathname: originalResponse.pathname
  })
  
  // Generate and upload resized versions
  for (const size of sizes) {
    const resized = originalImage.clone().resize({ w: size.width })
    const buffer = await resized.getBuffer(type)
    const blobData = new Blob([new Uint8Array(buffer)], { type })
    const response = await blob.put(`${imagePrefix}/${size.suffix}.${extension}`, blobData, {
      addRandomSuffix: false,
    })

    generatedVariants.push({
      size: size.suffix,
      width: resized.width,
      height: resized.height,
      pathname: response.pathname
    })
  }

  // Update database entry with new variants
  const updateResponse = await db.get(sql`
    UPDATE images 
    SET pathname = ${imagePrefix},
        variants = ${JSON.stringify(generatedVariants)},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `)

  // Update grid layout
  const layout = (await kv.get('grid:main') ?? []) as Image[]
  const updatedLayout = layout.map((item) => {
    if (item.id === parseInt(id)) {
      return {
        ...item,
        pathname: generatedVariants.find(v => v.size === 'original')?.pathname || imagePrefix,
        variants: JSON.stringify(generatedVariants),
        updated_at: new Date().toISOString()
      }
    }
    return item
  })

  await kv.set('grid:main', updatedLayout)

  return {
    success: true,
    results: [updateResponse],
  }
})
