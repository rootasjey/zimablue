import { z } from 'zod'

const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  is_public: z.boolean().optional().default(true),
  image_ids: z.array(z.number()).optional().default([]),
  cover_image_id: z.number().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  if (!user.id) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to create a collection'
    })
  }

  try {
    const body = await readBody(event)
    
    // Validate request body
    const validatedData = createCollectionSchema.parse(body)
    
    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
    
    const db = hubDatabase()
    
    try {
      // 1. Create the collection
      const collectionStmt = db.prepare(`
        INSERT INTO collections (
          name, 
          description, 
          is_public, 
          slug, 
          user_id,
          cover_image_id
        )
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING id, name, description, is_public, slug, created_at
      `)
      .bind(
        validatedData.name,
        validatedData.description,
        validatedData.is_public ? 1 : 0,
        slug,
        user.id,
        validatedData.cover_image_id || null
      )
      
      // Prepare batch operations
      const batchOperations = [collectionStmt]
      
      // Execute the first statement to get the collection ID
      const collectionResult = await collectionStmt.first()
      
      if (!collectionResult) {
        throw new Error('Failed to create collection')
      }
      
      const collectionId = collectionResult.id
      
      // 2. Add images to the collection if provided
      if (validatedData.image_ids && validatedData.image_ids.length > 0) {
        // Verify all images exist
        const imageIdsStr = validatedData.image_ids.join(',')
        const existingImagesResult = await db.prepare(`
          SELECT id FROM images 
          WHERE id IN (${imageIdsStr})
        `)
        .run()
        
        if (!existingImagesResult.success) {
          throw new Error('Failed to verify image existence')
        }
        
        const existingImageIds = existingImagesResult.results.map(img => img.id)
        
        // Add each image to the collection with incremental position
        const imageInsertStatements = existingImageIds.map((imageId, i) => {
          return db.prepare(`
            INSERT INTO collection_images (collection_id, image_id, position)
            VALUES (?, ?, ?)
          `)
          .bind(collectionId, imageId, i)
        })
        
        // Add image insert statements to batch operations
        batchOperations.push(...imageInsertStatements)
        
        // If no cover image was specified but images were added, use the first image as cover
        if (!validatedData.cover_image_id && existingImageIds.length > 0) {
          const updateCoverStmt = db.prepare(`
            UPDATE collections
            SET cover_image_id = ?
            WHERE id = ?
          `)
          .bind(existingImageIds[0], collectionId)
          
          batchOperations.push(updateCoverStmt)
        }
      }
      
      // Execute all operations in a batch (transaction)
      if (batchOperations.length > 1) {
        await db.batch(batchOperations.slice(1)) // Skip the first one as we already executed it
      }
      
      // Fetch the complete collection with image count
      const finalCollection = await db.prepare(`
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM collection_images WHERE collection_id = c.id) as image_count
        FROM collections c
        WHERE c.id = ?
      `)
      .bind(collectionId)
      .first()
      
      return {
        success: true,
        message: 'Collection created successfully',
        collection: finalCollection
      }
      
    } catch (error) {
      throw error
    }
    
  } catch (error) {
    console.error('Error creating collection:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Validation error',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to create collection'
    })
  }
})
