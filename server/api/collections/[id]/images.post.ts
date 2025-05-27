export default eventHandler(async (event) => {
  console.log(`0 • [server] POST ~server/api/collections/[id]/images.post.ts`);
  
  const collectionId = getRouterParam(event, 'id')
  console.log(`1 • [server] Collection ID: ${collectionId}`);
  const { imageId } = await readBody(event)
  console.log(`2 • [server] Image ID: ${imageId}`);

  if (!collectionId || !imageId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Collection ID and Image ID are required'
    })
  }

  try {
    const db = await hubDatabase()
    
    console.log(`3 • [server] Database connection established`);
    // Check if image is already in collection
    const existing = await db
    .prepare(`
      SELECT * FROM collection_images 
      WHERE collection_id = ? AND image_id = ?
    `)
    .bind(collectionId, imageId)
    .run()

    if (existing.results.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Image already exists in this collection'
      })
    }
    
    // Get the current highest position
    const { results: positionResult } = await db
    .prepare(`
      SELECT COALESCE(MAX(position), -1) as max_position
      FROM collection_images
      WHERE collection_id = ?
    `)
    .bind(imageId)
    .run()
    
    const max_position = positionResult[0] ? (positionResult[0]?.max_position as number) : -1
    let nextPosition = max_position + 1

    // Add image to collection
    await db
    .prepare(`
      INSERT INTO collection_images (collection_id, image_id, position)
      VALUES (?, ?, ?)
    `)
    .bind(collectionId, imageId, nextPosition)
    .run()

    return { success: true }
  } catch (error) {
    console.error('Error adding image to collection:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add image to collection'
    })
  }
})