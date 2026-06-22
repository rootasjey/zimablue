interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory fallback when KV is unavailable (edge cases)
const memBuckets = new Map<string, RateLimitEntry>()
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memBuckets) {
      if (entry.resetAt < now) memBuckets.delete(key)
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

// NOTE: On Cloudflare Workers, rate limiting via in-memory Map
// does NOT work correctly — each isolate has its own memory.
// For production, use KV (via @nuxthub/kv) or Cloudflare Rate Limiting (WAF).
// KV has ~1s eventual consistency, acceptable for soft rate limiting.

export const PUBLIC_LIMIT: RateLimitConfig = { maxRequests: 300, windowMs: 60_000 }
export const AUTH_LIMIT: RateLimitConfig = { maxRequests: 20, windowMs: 60_000 }
export const ADMIN_LIMIT: RateLimitConfig = { maxRequests: 300, windowMs: 60_000 }
export const UPLOAD_LIMIT: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 }

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

let kvAvailable = false
let kvStore: any = null

async function getKv() {
  if (kvStore === null) {
    try {
      const { kv } = await import('@nuxthub/kv')
      kvStore = kv
      kvAvailable = true
    } catch {
      kvAvailable = false
    }
  }
  return kvStore
}

export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const now = Date.now()

  // Try KV first
  const kv = await getKv()
  if (kvAvailable && kv) {
    try {
      const raw = await kv.get(key)
      if (raw) {
        const entry: RateLimitEntry = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (entry.resetAt > now) {
          entry.count++
          await kv.set(key, JSON.stringify(entry), { ttl: Math.ceil((entry.resetAt - now) / 1000) })
          const remaining = Math.max(0, config.maxRequests - entry.count)
          return { allowed: entry.count <= config.maxRequests, remaining, resetAt: entry.resetAt, limit: config.maxRequests }
        }
      }
      // Fresh window
      const entry: RateLimitEntry = { count: 1, resetAt: now + config.windowMs }
      await kv.set(key, JSON.stringify(entry), { ttl: Math.ceil(config.windowMs / 1000) })
      return { allowed: true, remaining: config.maxRequests - 1, resetAt: entry.resetAt, limit: config.maxRequests }
    } catch {
      // KV error — fall through to in-memory
    }
  }

  // In-memory fallback (local dev or KV error)
  const entry = memBuckets.get(key)
  if (entry && entry.resetAt > now) {
    entry.count++
    const remaining = Math.max(0, config.maxRequests - entry.count)
    return { allowed: entry.count <= config.maxRequests, remaining, resetAt: entry.resetAt, limit: config.maxRequests }
  }
  memBuckets.set(key, { count: 1, resetAt: now + config.windowMs })
  return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs, limit: config.maxRequests }
}

export function getClientIp(event: any): string {
  const forwarded = getHeader(event, 'x-forwarded-for') as string | undefined
  if (forwarded) return forwarded.split(',')[0] || '127.0.0.1'
  const cfIp = getHeader(event, 'cf-connecting-ip') as string | undefined
  if (cfIp) return cfIp
  return '127.0.0.1'
}

export function applyRateLimitHeaders(event: any, result: RateLimitResult): void {
  setHeader(event, 'ratelimit-limit', String(result.limit))
  setHeader(event, 'ratelimit-remaining', String(result.remaining))
  setHeader(event, 'ratelimit-reset', String(Math.ceil(result.resetAt / 1000)))
}
