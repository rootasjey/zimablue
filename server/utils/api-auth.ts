import { db } from 'hub:db'
import { eq, and, sql, gt, or } from 'drizzle-orm'
import { apiTokens, users } from '../db/schema'

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const encoded = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `zb_${encoded}`
}

async function getUserFromApiToken(event: any): Promise<{ id: number; name: string; email: string; role: string } | null> {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawToken = authHeader.slice(7).trim()
  if (!rawToken) return null

  const tokenHash = await hashToken(rawToken)

  const token = await db.select({
    id: apiTokens.id,
    userId: apiTokens.userId,
    expiresAt: apiTokens.expiresAt,
  })
    .from(apiTokens)
    .where(and(
      eq(apiTokens.tokenHash, tokenHash),
      eq(apiTokens.revoked, false),
      or(
        sql`${apiTokens.expiresAt} IS NULL`,
        gt(apiTokens.expiresAt, sql`CURRENT_TIMESTAMP`)
      )
    ))
    .get()

  if (!token) return null

  // Update last used timestamp
  await db.update(apiTokens)
    .set({ lastUsedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(apiTokens.id, token.id))

  // Fetch user
  const user = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
  })
    .from(users)
    .where(eq(users.id, token.userId))
    .get()

  return user || null
}

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
}

/**
 * Require authentication via session OR Bearer token.
 * Throws 401 if neither is valid.
 */
export async function requireApiAuth(event: any): Promise<AuthUser> {
  // Try Bearer token first
  const tokenUser = await getUserFromApiToken(event)
  if (tokenUser) return tokenUser

  // Fallback to session
  const session = await requireUserSession(event)
  const user = session.user as AuthUser | undefined
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  return user
}

/**
 * Require admin via session OR Bearer token.
 * Throws 403 if user is not admin.
 */
export async function requireApiAdmin(event: any): Promise<AuthUser> {
  const user = await requireApiAuth(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  return user
}

/**
 * Optional auth — returns user if token or session is valid, null otherwise.
 */
export async function getOptionalApiUser(event: any): Promise<AuthUser | null> {
  try {
    const tokenUser = await getUserFromApiToken(event)
    if (tokenUser) return tokenUser

    const session = await getUserSession(event)
    const user = session.user as AuthUser | undefined
    return user || null
  } catch {
    return null
  }
}

export { generateToken, hashToken }
