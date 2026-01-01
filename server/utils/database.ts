import { drizzle } from 'drizzle-orm/d1'
import * as schema from '~/server/db/schema'

export function initializeDatabase() {
  if ((globalThis as any).__db) {
    return (globalThis as any).__db
  }

  const env = process.env as any
  const database = env.DB

  if (!database) {
    throw new Error('Database binding not found. Make sure DB is configured in wrangler.jsonc')
  }

  const dbInstance = drizzle(database, { schema })
  ;(globalThis as any).__db = dbInstance
  return dbInstance
}

// Initialize on module load
const db = initializeDatabase()

export { db, schema }

