import { db } from '~/server/utils/database'
import type { ImageWithTags } from "~/types/image"
import { sql } from 'drizzle-orm'

export default eventHandler(async () => {
  // Get all images
  const imagesResponse = await db.all(sql`
    SELECT
      id, name, description, pathname, slug, variants,
      w, h, x, y, stats_views, stats_downloads, stats_likes,
      created_at, updated_at, user_id
    FROM images
    ORDER BY sum_abs ASC
  `)

  const images = imagesResponse as any[]
  const imageIds = images.map(img => img.id)

  // Get tags for all images
  let imageTagsMap = new Map<number, any[]>()
  if (imageIds.length > 0) {
    const imageIdsStr = imageIds.join(',')
    const tagsResult = await db.all(sql.raw(`
      SELECT
        it.image_id,
        t.id, t.name, t.slug, t.description, t.color, t.usage_count,
        t.created_at, t.updated_at
      FROM image_tags it
      JOIN tags t ON it.tag_id = t.id
      WHERE it.image_id IN (${imageIdsStr})
      ORDER BY t.name
    `))

    // Group tags by image_id
    for (const tagRow of (tagsResult as any[])) {
      if (!imageTagsMap.has(tagRow.image_id)) {
        imageTagsMap.set(tagRow.image_id, [])
      }
      imageTagsMap.get(tagRow.image_id)!.push({
        id: tagRow.id,
        name: tagRow.name,
        slug: tagRow.slug,
        description: tagRow.description,
        color: tagRow.color,
        usage_count: tagRow.usage_count,
        created_at: tagRow.created_at,
        updated_at: tagRow.updated_at
      })
    }
  }

  // Combine images with their tags
  const imagesWithTags = images.map(img => ({
    ...img,
    tags: imageTagsMap.get(img.id) || []
  })) as ImageWithTags[]

  return imagesWithTags
})
