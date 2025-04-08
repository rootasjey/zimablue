import { z } from 'zod'

const collectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  items: z.array(z.number()).optional(),
  cover_image_id: z.number().optional(),
  slug: z.string().optional(),
  is_public: z.boolean().optional().default(true)
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    // Validate request body
    const validatedData = collectionSchema.parse(body)
    
    // Generate slug if not provided
    if (!validatedData.slug && validatedData.name) {
      validatedData.slug = validatedData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
    }
    
    // Convert items array to JSON string
    const itemsJson = JSON.stringify(validatedData.items || [])
    const db = hubDatabase()

    const queryResponse = await db.prepare(`
      INSERT INTO collections (name, description, is_public)
      VALUES (?, ?, ?)
      RETURNING id, name, description, items, cover_image_id, slug, is_public, created_at, updated_at
    `)
    .bind(
      validatedData.name,
      validatedData.description,
      validatedData.is_public
    )
    .run()

    if (!queryResponse.success) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create collection in database'
      })
    }
    
    // Parse the items JSON string back to an array
    const newCollection = {
      ...queryResponse.results[0],
      items: JSON.parse((queryResponse.results[0].items as string) || '[]')
    }
    
    return {
      success: true,
      collection: newCollection
    }
  } catch (error) {
    console.error('Error creating collection:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid collection data',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to create collection'
    })
  }
})
