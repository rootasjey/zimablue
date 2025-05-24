import { Image } from "~/types/image"

// /api/images/[id].patch.ts
export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id || !body) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields'
    })
  }
  
  const { name, description, slug, tags } = body
  
  try {
    // Validate slug uniqueness if provided
    if (slug) {
      const existingResponse = await hubDatabase()
        .prepare(`
          SELECT id FROM images
          WHERE slug = ?1 AND id != ?2
        `)
        .bind(slug, id)
        .run()
      
      if (existingResponse.results && existingResponse.results.length > 0) {
        throw createError({
          statusCode: 400,
          message: 'Slug already exists'
        })
      }
    }
    
    // Update the image
    const updateResponse = await hubDatabase()
      .prepare(`
        UPDATE images
        SET name = ?1, description = ?2, slug = ?3, tags = ?4
        WHERE id = ?5
      `)
      .bind(name, description, slug, tags, id)
      .run()
    
    if (!updateResponse.success) {
      throw createError({
        statusCode: 500,
        message: 'Failed to update image'
      })
    }

    // Update grid layout (in hubKV)
    const layout = (await hubKV().get('grid:main') ?? []) as Image[]
    const updatedLayout = layout.map((item) => {
      if (item.id === parseInt(id)) {
        return {
          ...item,
          name,
          description,
          slug,
          tags,
          updated_at: new Date().toISOString()
        }
      }
      return item
    })

    await hubKV().set('grid:main', updatedLayout)

    return { success: true }
  } catch (error) {
    console.error('Error updating image:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update image'
    })
  }
})