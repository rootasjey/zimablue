import { db } from 'hub:db'
import { Jimp } from 'jimp'
import { generateUniquePathname } from './utils/generateUniquePathname'
import { generateUniqueSlug } from './utils/generateUniqueSlug'
import { eq } from 'drizzle-orm'
import { blob } from 'hub:blob'
import { images } from '../../db/schema'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  
  if (session.user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }
  
  const userId = (session.user as any).id as number

  const formData = await readMultipartFormData(event)
  const file = formData?.find(item => item.name === 'file')?.data
  const fileName = formData?.find(item => item.name === 'fileName')?.data.toString()
  const type = formData?.find(item => item.name === 'type')?.data.toString()
  const x = formData?.find(item => item.name === 'x')?.data.toString()
  const y = formData?.find(item => item.name === 'y')?.data.toString()
  const w = formData?.find(item => item.name === 'w')?.data.toString()
  const h = formData?.find(item => item.name === 'h')?.data.toString()
  const id = formData?.find(item => item.name === 'id')?.data.toString()

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

  // Create a unique ID for the image folder
  const extension = type.split('/')[1] || 'jpg'
  const baseName = fileName.substring(0, fileName.lastIndexOf('.'))
  const imagePrefix = await generateUniquePathname(baseName, extension || 'jpg')


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
  const generatedVariants = []
  
  // Upload original image
  const originalBuffer = await originalImage.getBuffer(type)
  const originalBlob = new Blob([originalBuffer as any], { type })

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
    const blobData = new Blob([buffer as any], { type })
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

  const slug = await generateUniqueSlug(fileName)

  // Store the image metadata in the database
  const insertResponse = await db.insert(images).values({
    name: fileName,
    pathname: imagePrefix,
    x: Number(x),
    y: Number(y),
    w: Number(w),
    h: Number(h),
    slug: slug,
    userId: userId,
    variants: JSON.stringify(generatedVariants)
  }).returning({ id: images.id })

  const newImageId = insertResponse[0].id

  const selectResponse = await db.select()
    .from(images)
    .where(eq(images.id, newImageId))
    .get()

  console.log('Upload complete for image ID:', newImageId)

  return {
    ...(selectResponse as any),
    ok: true,
  }
})
