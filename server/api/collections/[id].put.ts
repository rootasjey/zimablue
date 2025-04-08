import { z } from 'zod'

const updateCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  items: z.array(z.number()).optional(),
  cover_image_id: z.number().optional().nullable(),
  slug: z.string().optional(),
  is_public: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid collection ID'
    })
  }

  const body = await readBody(event)

  try {
    // Validate request body
    const validatedData = updateCollectionSchema.parse(body)

    // Generate slug if name is provided but slug is not
    if (validatedData.name && !validatedData.slug) {
      validatedData.slug = validatedData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
    }

    const db = hubDatabase()

    // Check if collection exists
    const queryResponse = await db.prepare(`
      SELECT id FROM collections WHERE id = ?
    `)
    .bind(id)
    .run()

    if (!queryResponse.success || queryResponse.results.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Collection not found'
      })
    }

    // Build the update query dynamically based on provided fields
    const updates = []
    const params = []

    if (validatedData.name !== undefined) {
      updates.push('name = ?')
      params.push(validatedData.name)
    }

    if (validatedData.description !== undefined) {
      updates.push('description = ?')
      params.push(validatedData.description)
    }

    if (validatedData.items !== undefined) {
      updates.push('items = ?')
      params.push(JSON.stringify(validatedData.items))
    }

    if (validatedData.cover_image_id !== undefined) {
      updates.push('cover_image_id = ?')
      params.push(validatedData.cover_image_id)
    }

    if (validatedData.slug !== undefined) {
      updates.push('slug = ?')
      params.push(validatedData.slug)
    }

    if (validatedData.is_public !== undefined) {
      updates.push('is_public = ?')
      params.push(validatedData.is_public)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')

    if (updates.length === 1) {
      // Only updated_at was added, no actual changes
      throw createError({
        statusCode: 400,
        message: 'No fields to update were provided'
      })
    }

    // Add the ID parameter for the WHERE clause
    params.push(id)

    // Execute the update
    await db.prepare(`
      UPDATE collections
      SET ${updates.join(', ')}
      WHERE id = ?
    `)
    .bind(...params)
    .run()

    // Fetch the updated collection
    const { results: updatedCollections } = await db.prepare(`
      SELECT id, name, description, items, cover_image_id, slug, is_public, stats_views, created_at, updated_at
      FROM collections
      WHERE id = ?
    `)
    .bind(id)
    .all()

    // Parse the items JSON string to an array
    const updatedCollection = {
      ...updatedCollections[0],
      items: JSON.parse((updatedCollections[0].items as string) || '[]')
    }

    return {
      success: true,
      collection: updatedCollection
    }
  } catch (error) {
    console.error(`Error updating collection ${id}:`, error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid collection data',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to update collection'
    })
  }
})
