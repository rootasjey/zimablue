import { db } from 'hub:db'
import { eq } from 'drizzle-orm'
import { tags } from '../db/schema'
import { generateSlug, ensureUniqueSlug } from './slug'

export async function ensureTag(tagName: string): Promise<number> {
  const existingTag = await db.select({ id: tags.id })
    .from(tags)
    .where(eq(tags.name, tagName))
    .get()

  if (existingTag) {
    return existingTag.id
  }

  const slug = generateSlug(tagName)
  const finalSlug = await ensureUniqueSlug(slug, async (candidate) => {
    const result = await db.select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, candidate))
      .get()
    return !!result
  })

  const insertResult = await db.insert(tags)
    .values({ name: tagName, slug: finalSlug })
    .returning({ id: tags.id })

  if (!insertResult || insertResult.length === 0 || !insertResult[0]?.id) {
    throw new Error('Failed to insert tag')
  }

  return insertResult[0].id
}

export async function findTagByName(name: string) {
  return db.select({ id: tags.id })
    .from(tags)
    .where(eq(tags.name, name))
    .get()
}
