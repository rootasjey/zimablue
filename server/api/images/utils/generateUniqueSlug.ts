import { db } from 'hub:db'
import slugify from 'slugify'
import { eq } from 'drizzle-orm'
import { images } from '../../../db/schema'

/**
 * Generates a unique slug for an image by combining a base slug with a unique identifier.
 * 
 * @param baseName - The original name to be converted into a slug
 * @returns A Promise resolving to a unique slug string that does not exist in the database
 */
export const generateUniqueSlug = async (baseName: string): Promise<string> => {
  const baseSlug = slugify(baseName, { lower: true, strict: true })
  const uniquePart = Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
  const proposedSlug = `${baseSlug}-${uniquePart}`
  
  // Check if slug already exists
  const existingSlug = await db.select({ slug: images.slug })
    .from(images)
    .where(eq(images.slug, proposedSlug))
    .get()
  
  // If slug exists, recursively try again
  if (existingSlug) {
    return generateUniqueSlug(baseName)
  }
  
  return proposedSlug
}