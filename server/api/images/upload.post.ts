import { Jimp } from 'jimp'
import { generateUniquePathname } from '~/server/api/images/utils/generateUniquePathname'
import { generateUniqueSlug } from './utils/generateUniqueSlug'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id

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
  const extension = type.split('/')[1]
  const baseName = fileName.substring(0, fileName.lastIndexOf('.'))
  const imagePrefix = await generateUniquePathname(baseName, extension)


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

  const slug = await generateUniqueSlug(fileName)

  // Store the image metadata in the database
  const insertResponse = await hubDatabase()
    .prepare(`
      INSERT INTO images (name, pathname, x, y, w, h, slug, user_id, variants)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    `)
    .bind(
      fileName,
      imagePrefix,
      x,
      y,
      w,
      h,
      slug,
      userId,
      JSON.stringify(generatedVariants)
    )
    .run()

  if (!insertResponse.success) {
    throw createError({
      statusCode: 500,
      message: 'Failed to insert image into database',
    })
  }

  const selectResponse = await hubDatabase()
  .prepare(`
    SELECT * FROM images
    WHERE id = ?1
  `)
  .bind(insertResponse.meta.last_row_id)
  .run()

  return {
    ...selectResponse,
    ok: true,
  }
})
