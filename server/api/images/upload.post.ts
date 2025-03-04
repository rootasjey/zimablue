export default eventHandler(async (event) => {
  await requireUserSession(event)

  const formData = await readMultipartFormData(event)
  const file = formData?.find(item => item.name === 'file')?.data
  const fileName = formData?.find(item => item.name === 'fileName')?.data.toString()
  const type = formData?.find(item => item.name === 'type')?.data.toString()
  const x = formData?.find(item => item.name === 'x')?.data.toString()
  const y = formData?.find(item => item.name === 'y')?.data.toString()
  const w = formData?.find(item => item.name === 'w')?.data.toString()
  const h = formData?.find(item => item.name === 'h')?.data.toString()
  const id = formData?.find(item => item.name === 'id')?.data.toString()
  
  if (!file || !fileName || !type) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields',
    })
  }

  const blob = new Blob([file], { type })
  const blobResponse = await hubBlob().put(fileName, blob, {
    addRandomSuffix: true,
    prefix: 'images',
  })

  const pathname = blobResponse.pathname
  const insertResponse = await hubDatabase()
    .prepare(`
      INSERT INTO images (name, pathname, x, y, w, h, id)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
    `)
    .bind(pathname, pathname, x, y, w, h, id)
    .run()

  if (!insertResponse.success) {
    throw createError({
      statusCode: 500,
      message: 'Failed to insert image into database',
    })
  }

  const selectResponse = await hubDatabase()
  .prepare(`
    SELECT * FROM images
    WHERE id = ?1
  `)
  .bind(insertResponse.meta.last_row_id)
  .run()

  return {
    ...selectResponse,
    ok: true,
  }
})

async function getNextXY() {
  const response = await hubDatabase()
    .prepare('SELECT x, y FROM images ORDER BY id')
    .all()
    
  const coordinates: Array<{x: number, y: number}> = response.results
    .map(row => ({ x: row.x as number, y: row.y as number }))

  return getNextSpiralCoordinate(coordinates)
}

function getNextSpiralCoordinate(coordinates: Array<{x: number, y: number}>): {x: number, y: number} {
  if (coordinates.length === 0) {
    return { x: 0, y: 0 }
  }

  // Find the current layer (Manhattan distance from center)
  const maxDistance = Math.max(...coordinates.map(c => Math.max(Math.abs(c.x), Math.abs(c.y))))

  // Check all positions in current layer and next layer
  for (let layer = maxDistance; layer <= maxDistance + 1; layer++) {
    // Define spiral pattern for each layer
    const positions = [
      ...Array.from({ length: layer * 2 + 1 }, (_, i) => ({ x: -layer, y: -layer + i })), // Left side
      ...Array.from({ length: layer * 2 }, (_, i) => ({ x: -layer + 1 + i, y: layer })),  // Top side
      ...Array.from({ length: layer * 2 }, (_, i) => ({ x: layer, y: layer - 1 - i })),   // Right side
      ...Array.from({ length: layer * 2 - 1 }, (_, i) => ({ x: layer - 1 - i, y: -layer })) // Bottom side
    ]

    // Find first available position
    const available = positions.find(pos =>
      !coordinates.some(c => c.x === pos.x && c.y === pos.y)
    )

    if (available) {
      return available
    }
  }

  return { x: 0, y: 0 } // Fallback, should never reach here
}