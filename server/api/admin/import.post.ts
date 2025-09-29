export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session?.user || session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')?.data
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file' })
  }

  const text = new TextDecoder().decode(file)
  const payload = JSON.parse(text)
  const db = hubDatabase()

  const counts = { images: 0, collections: 0, tags: 0 }

  // Import tags
  if (Array.isArray(payload.tags)) {
    for (const t of payload.tags) {
      await db.prepare(`
        INSERT OR REPLACE INTO tags (id, name, slug, description, color, usage_count, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, COALESCE(?7, CURRENT_TIMESTAMP), COALESCE(?8, CURRENT_TIMESTAMP))
      `).bind(t.id, t.name, t.slug, t.description ?? '', t.color ?? '#3B82F6', t.usage_count ?? 0, t.created_at, t.updated_at).run()
      counts.tags++
    }
  }

  // Import images (metadata only)
  if (Array.isArray(payload.images)) {
    for (const i of payload.images) {
      await db.prepare(`
        INSERT OR REPLACE INTO images (id, name, description, pathname, slug, w, h, x, y, stats_views, stats_downloads, stats_likes, created_at, updated_at, user_id, variants)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, COALESCE(?13, CURRENT_TIMESTAMP), COALESCE(?14, CURRENT_TIMESTAMP), COALESCE(?15, 1), COALESCE(?16, '[]'))
      `).bind(i.id, i.name, i.description ?? '', i.pathname, i.slug, i.w ?? 6, i.h ?? 6, i.x ?? 0, i.y ?? 0, i.stats_views ?? 0, i.stats_downloads ?? 0, i.stats_likes ?? 0, i.created_at, i.updated_at, i.user_id, typeof i.variants === 'string' ? i.variants : JSON.stringify(i.variants ?? [])).run()
      counts.images++
    }
  }

  // Import collections
  if (Array.isArray(payload.collections)) {
    for (const c of payload.collections) {
      await db.prepare(`
        INSERT OR REPLACE INTO collections (id, name, description, slug, is_public, stats_likes, stats_views, stats_downloads, user_id, cover_image_id, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, COALESCE(?5, 1), COALESCE(?6, 0), COALESCE(?7, 0), COALESCE(?8, 0), COALESCE(?9, 1), ?10, COALESCE(?11, CURRENT_TIMESTAMP), COALESCE(?12, CURRENT_TIMESTAMP))
      `).bind(c.id, c.name, c.description ?? '', c.slug, c.is_public ?? 1, c.stats_likes ?? 0, c.stats_views ?? 0, c.stats_downloads ?? 0, c.user_id, c.cover_image_id ?? null, c.created_at, c.updated_at).run()
      counts.collections++
    }
  }

  // Relations
  if (Array.isArray(payload.image_tags)) {
    for (const it of payload.image_tags) {
      await db.prepare(`INSERT OR IGNORE INTO image_tags (image_id, tag_id, created_at) VALUES (?1, ?2, COALESCE(?3, CURRENT_TIMESTAMP))`).bind(it.image_id, it.tag_id, it.created_at).run()
    }
  }

  if (Array.isArray(payload.collection_images)) {
    for (const ci of payload.collection_images) {
      await db.prepare(`INSERT OR IGNORE INTO collection_images (collection_id, image_id, position, added_at) VALUES (?1, ?2, COALESCE(?3, 0), COALESCE(?4, CURRENT_TIMESTAMP))`).bind(ci.collection_id, ci.image_id, ci.position, ci.added_at).run()
    }
  }

  return { success: true, counts }
})
