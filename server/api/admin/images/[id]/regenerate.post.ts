import { z } from 'zod'
import { Jimp } from 'jimp'
import type { VariantType } from '~/types/image'

const sizes = [
  { width: 160, suffix: 'xxs' },
  { width: 320, suffix: 'xs' },
  { width: 640, suffix: 'sm' },
  { width: 1024, suffix: 'md' },
  { width: 1920, suffix: 'lg' },
]

const extToMime = (ext: string) => {
  switch (ext.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'bmp':
    case 'dib':
      return 'image/bmp'
    case 'tiff':
    case 'tif':
      return 'image/tiff'
    default:
      return 'image/jpeg'
  }
}

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session?.user || session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const { id } = await getValidatedRouterParams(event, z.object({ id: z.string().min(1) }).parse)

  // Fetch image row
  const imageRow = await hubDatabase().prepare(`SELECT * FROM images WHERE id = ?1`).bind(id).first()
  if (!imageRow) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }

  let variants: VariantType[] = []
  try {
    const v = (imageRow as any).variants
    variants = JSON.parse(typeof v === 'string' ? v : '[]')
  } catch {
    variants = []
  }

  // Try to get original blob; fallback to largest variant
  const original = variants.find(v => v.size === 'original')
  const lg = variants.find(v => v.size === 'lg')
  const sourcePath = original?.pathname || lg?.pathname
  if (!sourcePath) {
    throw createError({ statusCode: 404, statusMessage: 'No source variant available to regenerate' })
  }

  const sourceBlob = await hubBlob().get(sourcePath)
  if (!sourceBlob) {
    throw createError({ statusCode: 404, statusMessage: 'Source blob not found' })
  }
  const buffer = Buffer.from(await sourceBlob.arrayBuffer())
  const image = await Jimp.fromBuffer(buffer)

  // Determine extension and mime from source path
  const ext = sourcePath.split('.').pop() || 'jpg'
  const mime = extToMime(ext)

  // Re-upload original to the same path to refresh metadata
  const originalBuffer = await image.getBuffer(mime)
  const originalArray = new Uint8Array(originalBuffer)
  await hubBlob().put((original?.pathname) || sourcePath, new Blob([originalArray], { type: mime }), { addRandomSuffix: false })

  const newVariants: VariantType[] = []
  newVariants.push({ size: 'original', width: image.width, height: image.height, pathname: (original?.pathname) || sourcePath })

  // Regenerate sizes and overwrite existing variant files if present; otherwise keep same naming scheme alongside existing prefix
  const pathForPrefix = (original?.pathname || sourcePath)
  const prefix = pathForPrefix.substring(0, pathForPrefix.lastIndexOf('/'))

  for (const s of sizes) {
    const resized = image.clone().resize({ w: s.width })
    const resizedBuffer = await resized.getBuffer(mime)
    // find an existing variant path for this suffix, else create under prefix
    const existing = variants.find(v => v.size === s.suffix)
    const targetPath = existing?.pathname || `${prefix}/${s.suffix}.${ext}`
    const resizedArray = new Uint8Array(resizedBuffer)
    await hubBlob().put(targetPath, new Blob([resizedArray], { type: mime }), { addRandomSuffix: false })
    newVariants.push({ size: s.suffix, width: resized.width, height: resized.height, pathname: targetPath })
  }

  // Update DB
  const updated = await hubDatabase().prepare(`
    UPDATE images SET variants = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2 RETURNING *
  `).bind(JSON.stringify(newVariants), id).first()

  return { success: true, data: updated }
})
