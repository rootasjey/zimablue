import { ImageWithTags } from "~/types/image"

export default eventHandler(async () => {
  const db = hubDatabase()

  // Get all images
  const imagesResponse = await db.prepare(`
    SELECT
      id, name, description, pathname, slug, variants,
      w, h, x, y, stats_views, stats_downloads, stats_likes,
      created_at, updated_at, user_id
    FROM images
    ORDER BY sum_abs ASC
  `).all()

  const images = imagesResponse.results as any[]
  const imageIds = images.map(img => img.id)

  // Get tags for all images
  let imageTagsMap = new Map<number, any[]>()
  if (imageIds.length > 0) {
    const tagsResult = await db.prepare(`
      SELECT
        it.image_id,
        t.id, t.name, t.slug, t.description, t.color, t.usage_count,
        t.created_at, t.updated_at
      FROM image_tags it
      JOIN tags t ON it.tag_id = t.id
      WHERE it.image_id IN (${imageIds.map(() => '?').join(',')})
      ORDER BY t.name
    `).bind(...imageIds).all()

    // Group tags by image_id
    for (const tagRow of (tagsResult.results as any[])) {
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
