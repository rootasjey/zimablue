import { db } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { TagCreateRequest } from "~~/shared/types/tag"
import { tags } from '../../db/schema'
import { generateSlug, ensureUniqueSlug } from '../../utils/slug'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event) as TagCreateRequest
  if (!body.name || !body.name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Tag name is required' })
  }

  try {
    const name = body.name.trim()
    const description = body.description?.trim() || ''
    const color = body.color || '#3B82F6'

    const existingTag = await db.select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, name))
      .get()

    if (existingTag) {
      throw createError({ statusCode: 409, statusMessage: 'Tag already exists' })
    }

    const slug = generateSlug(name)
    const finalSlug = await ensureUniqueSlug(slug, async (candidate) => {
      const result = await db.select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, candidate))
        .get()
      return !!result
    })

    const insertResult = await db.insert(tags)
      .values({ name, slug: finalSlug, description, color })
      .returning()
      .get()

    return { success: true, data: insertResult }
  } catch (error: any) {
    console.error('Error creating tag:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to create tag' })
  }
})
