import { db } from 'hub:db'
import { eq, desc, isNull } from 'drizzle-orm'
import { images } from '../../db/schema'
import { keysToSnake } from '../../utils/case'

export default eventHandler(async () => {
  const result = await db.select({
    id: images.id,
    name: images.name,
    pathname: images.pathname,
  })
    .from(images)
    .where(isNull(images.aspectGroupId))
    .orderBy(desc(images.createdAt))
    .limit(6)
    .all()

  return result.map(keysToSnake)
})
