import { z } from 'zod'
import { Image, VariantType } from '~/types/image'
import { Jimp } from 'jimp'
import { generateUniquePathname } from '~/server/api/images/utils/generateUniquePathname'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string().min(1)
  }).parse)

  // Get existing image entry
  const existingImage: Image | null = await hubDatabase()
    .prepare(`
      SELECT * FROM images
      WHERE id = ?1
    `)
    .bind(id)
    .first()

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
    const variants = JSON.parse(existingImage.variants)
    for (const variant of variants) {
      if (variant.pathname) {
        await hubBlob().delete(variant.pathname)
      }
    }
  } catch (error) {
    console.error('Error deleting old image files:', error)
    // Continue with replacement even if deletion fails
  }

  // Create a unique ID for the image folder (reuse existing prefix if possible)
    const extension = type.split('/')[1]
    const baseName = fileName.substring(0, fileName.lastIndexOf('.'))
    const imagePrefix = existingImage.pathname && existingImage.pathname.includes('/')
    ? existingImage.pathname
    : await generateUniquePathname(baseName, extension)

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
  const originalBlob = new Blob([originalBuffer], { type })
  
  const originalResponse = await hubBlob().put(`${imagePrefix}/original.${extension}`, originalBlob, {
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
    const blob = new Blob([buffer], { type })
    const response = await hubBlob().put(`${imagePrefix}/${size.suffix}.${extension}`, blob, {
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
  const updateResponse = await hubDatabase()
    .prepare(`
      UPDATE images 
      SET pathname = ?1,
          variants = ?2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?3
      RETURNING *
    `)
    .bind(imagePrefix, JSON.stringify(generatedVariants), id)
    .first()

  // Update grid layout
  const layout = (await hubKV().get('grid:main') ?? []) as Image[]
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

  await hubKV().set('grid:main', updatedLayout)

  return {
    success: true,
    results: [updateResponse],
  }
})
