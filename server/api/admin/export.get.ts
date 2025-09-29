export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session?.user || session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const db = hubDatabase()
  const [images, collections, users, tags, image_tags, collection_images] = await Promise.all([
    db.prepare('SELECT * FROM images').all(),
    db.prepare('SELECT * FROM collections').all(),
    db.prepare('SELECT id, name, email, role, created_at, updated_at, biography, job, language, location, socials FROM users').all(),
    db.prepare('SELECT * FROM tags').all(),
    db.prepare('SELECT * FROM image_tags').all(),
    db.prepare('SELECT * FROM collection_images').all(),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    images: images.results,
    collections: collections.results,
    users: users.results,
    tags: tags.results,
    image_tags: image_tags.results,
    collection_images: collection_images.results,
  }

  const json = JSON.stringify(payload, null, 2)
  setHeader(event, 'Content-Type', 'application/json')
  setHeader(event, 'Content-Disposition', `attachment; filename="zimablue-export.json"`)
  return json
})
