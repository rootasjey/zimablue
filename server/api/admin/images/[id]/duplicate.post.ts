import { db } from 'hub:db'
import { eq } from 'drizzle-orm'
import { blob } from 'hub:blob'
import { images, imageTags } from '../../../../db/schema'
import { generateUniquePathname } from '../../../images/utils/generateUniquePathname'
import { generateUniqueSlug } from '../../../images/utils/generateUniqueSlug'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const imageId = getRouterParam(event, 'id')
  if (!imageId) {
    throw createError({ statusCode: 400, statusMessage: 'Image ID is required' })
  }

  const original = await db.select()
    .from(images)
    .where(eq(images.id, Number(imageId)))
    .get()

  if (!original) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }

  let variants: Array<{ size: string; width: number; height: number; pathname: string }> = []
  try {
    variants = JSON.parse(typeof original.variants === 'string' ? original.variants : '[]')
  } catch {
    variants = []
  }

  const ext = original.pathname.split('.').pop() || 'jpg'
  const namePart = original.name.substring(0, original.name.lastIndexOf('.')) || original.name
  const newPathnamePrefix = await generateUniquePathname(namePart, ext)
  const newSlug = await generateUniqueSlug(original.name)

  const newVariants: Array<{ size: string; width: number; height: number; pathname: string }> = []

  for (const variant of variants) {
    const blobData = await blob.get(variant.pathname)
    if (!blobData) {
      console.error(`Failed to fetch blob for variant ${variant.size}: ${variant.pathname}`)
      continue
    }
    const destPath = `${newPathnamePrefix}/${variant.size}.${ext}`
    const result = await blob.put(destPath, blobData, { addRandomSuffix: false })
    newVariants.push({
      size: variant.size,
      width: variant.width,
      height: variant.height,
      pathname: result.pathname,
    })
  }

  const userId = (session.user as any).id as number

  const insertResult = await db.insert(images).values({
    name: `${original.name} (Copy)`,
    description: original.description || '',
    pathname: newPathnamePrefix,
    slug: newSlug,
    w: original.w,
    h: original.h,
    x: original.x,
    y: original.y,
    userId,
    variants: JSON.stringify(newVariants),
  }).returning({ id: images.id })

  const newId = insertResult?.[0]?.id
  if (!newId) {
    throw createError({ statusCode: 500, message: 'Failed to create duplicate image record' })
  }

  const origTags = await db.select({ tagId: imageTags.tagId })
    .from(imageTags)
    .where(eq(imageTags.imageId, Number(imageId)))
    .all()

  if (origTags.length > 0) {
    await db.insert(imageTags).values(
      origTags.map(t => ({ imageId: newId, tagId: t.tagId }))
    )
  }

  const newImage = await db.select()
    .from(images)
    .where(eq(images.id, newId))
    .get()

  return { success: true, data: newImage }
})
