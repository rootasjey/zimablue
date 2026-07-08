import { db } from 'hub:db'
import { sql, isNull, eq, asc, inArray } from 'drizzle-orm'
import { images, tags, imageTags } from '../../db/schema'
import { keysToSnake } from '../../utils/case'
import type { ImageWithTags } from '~~/shared/types/image'

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 1, 1), 50)

  const rows = await db.select()
    .from(images)
    .where(isNull(images.aspectGroupId))
    .orderBy(sql`RANDOM()`)
    .limit(limit)
    .all()

  if (rows.length === 0) {
    throw createError({ statusCode: 404, message: 'No images found' })
  }

  const ids = rows.map(r => r.id)
  const tagRows = await db.select({
      imageId: imageTags.imageId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      description: tags.description,
      color: tags.color,
      usageCount: tags.usageCount,
      createdAt: tags.createdAt,
      updatedAt: tags.updatedAt,
    })
    .from(imageTags)
    .innerJoin(tags, eq(imageTags.tagId, tags.id))
    .where(inArray(imageTags.imageId, ids))
    .orderBy(asc(tags.name))
    .all()

  const tagsByImage = new Map<number, any[]>()
  for (const t of tagRows) {
    if (!tagsByImage.has(t.imageId)) tagsByImage.set(t.imageId, [])
    tagsByImage.get(t.imageId)!.push({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      color: t.color,
      usage_count: t.usageCount,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    })
  }

  const result = rows.map(r => keysToSnake({
    ...r,
    tags: tagsByImage.get(r.id) || [],
  } as unknown as ImageWithTags))

  return limit === 1 ? result[0] : result
})
