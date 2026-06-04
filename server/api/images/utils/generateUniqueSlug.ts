import { db } from 'hub:db'
import { eq } from 'drizzle-orm'
import { images } from '../../../db/schema'
import { normalizeSlug } from '../../../utils/slug'

export const generateUniqueSlug = async (baseName: string): Promise<string> => {
  const baseSlug = normalizeSlug(baseName)
  const uniquePart = Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
  const proposedSlug = `${baseSlug}-${uniquePart}`

  const existingSlug = await db.select({ slug: images.slug })
    .from(images)
    .where(eq(images.slug, proposedSlug))
    .get()

  if (existingSlug) {
    return generateUniqueSlug(baseName)
  }

  return proposedSlug
}
