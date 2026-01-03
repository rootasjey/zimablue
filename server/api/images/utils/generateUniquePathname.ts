import { db } from 'hub:db'
import slugify from 'slugify'
import { eq } from 'drizzle-orm'
import { images } from '../../../db/schema'

/**
 * Generates a unique pathname for an uploaded image
 * Format: filename-id.extension
 * @param baseName Original filename
 * @param extension File extension without dot (e.g. 'jpg')
 * @returns Promise resolving to a unique pathname
 */
export const generateUniquePathname = async (baseName: string, extension: string): Promise<string> => {
  const baseSlug = slugify(baseName, { lower: true, strict: true })
  // Generate a shorter unique ID using timestamp in base36 + 3 random chars
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
  const proposedPathname = `images/${baseSlug}-${uniqueId}.${extension}`
  
  // Check if pathname already exists in database
  const existingPathname = await db.select({ pathname: images.pathname })
    .from(images)
    .where(eq(images.pathname, proposedPathname))
    .get()
  
  // If pathname exists, recursively try again
  if (existingPathname) {
    return generateUniquePathname(baseName, extension)
  }
  
  return proposedPathname
}