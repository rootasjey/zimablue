import { db } from 'hub:db'
import { desc } from 'drizzle-orm'
import { images, users, messages, collections } from '~~/server/db/schema'
import { sql } from 'drizzle-orm'


const toIsoDate = (value: unknown) => {
  if (value == null) {
    return new Date().toISOString()
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString()
  }

  if (typeof value === 'number') {
    const timestamp = value > 1_000_000_000_000 ? value : value * 1000
    const date = new Date(timestamp)
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) {
      return new Date().toISOString()
    }

    // Normalize SQLite datetime format "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
    const normalized = trimmed.includes(' ') ? trimmed.replace(' ', 'T') : trimmed

    const numericValue = Number(normalized)
    const date = Number.isNaN(numericValue)
      ? new Date(normalized)
      : new Date(numericValue > 1_000_000_000_000 ? numericValue : numericValue * 1000)

    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
  }

  return new Date().toISOString()
}

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  const limit = 5

  // Fetch recent items from each table in parallel (raw createdAt to avoid Drizzle conversion issues)
  const [recentImages, recentMessages, recentUsers, recentCollections] = await Promise.all([
    db.select({
      id: images.id,
      name: images.name,
      createdAt: sql<unknown>`${images.createdAt}`,
      userName: users.name,
    })
      .from(images)
      .leftJoin(users, sql`${images.userId} = ${users.id}`)
      .orderBy(desc(images.createdAt))
      .limit(limit),

    db.select({
      id: messages.id,
      subject: messages.subject,
      senderEmail: messages.senderEmail,
      createdAt: sql<unknown>`${messages.createdAt}`,
    })
      .from(messages)
      .orderBy(desc(messages.createdAt))
      .limit(limit),

    db.select({
      id: users.id,
      name: users.name,
      createdAt: sql<unknown>`${users.createdAt}`,
    })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit),

    db.select({
      id: collections.id,
      name: collections.name,
      createdAt: sql<unknown>`${collections.createdAt}`,
      userName: users.name,
    })
      .from(collections)
      .leftJoin(users, sql`${collections.userId} = ${users.id}`)
      .orderBy(desc(collections.createdAt))
      .limit(limit),
  ])

  // Normalize to a unified activity shape
  type ActivityItem = {
    type: 'image' | 'collection' | 'message' | 'user'
    actor: string
    action: string
    target: string
    createdAt: string
  }

  const activities: ActivityItem[] = [
    ...recentImages.map((img: typeof recentImages[number]) => ({
      type: 'image' as const,
      actor: img.userName ?? 'Artist',
      action: 'uploaded',
      target: img.name,
      createdAt: toIsoDate(img.createdAt),
    })),
    ...recentMessages.map((msg: typeof recentMessages[number]) => ({
      type: 'message' as const,
      actor: msg.senderEmail,
      action: 'sent a message',
      target: msg.subject,
      createdAt: toIsoDate(msg.createdAt),
    })),
    ...recentUsers.map((u: typeof recentUsers[number]) => ({
      type: 'user' as const,
      actor: u.name,
      action: 'registered',
      target: 'account',
      createdAt: toIsoDate(u.createdAt),
    })),
    ...recentCollections.map((col: typeof recentCollections[number]) => ({
      type: 'collection' as const,
      actor: col.userName ?? 'Artist',
      action: 'created collection',
      target: col.name,
      createdAt: toIsoDate(col.createdAt),
    })),
  ]

  // Sort by createdAt descending
  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return {
    success: true,
    data: activities.slice(0, 15),
  }
})
