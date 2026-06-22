interface RateLimitEntry {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitEntry>()

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of buckets) {
      if (entry.resetAt < now) buckets.delete(key)
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export const PUBLIC_LIMIT: RateLimitConfig = { maxRequests: 100, windowMs: 60_000 }
export const AUTH_LIMIT: RateLimitConfig = { maxRequests: 20, windowMs: 60_000 }
export const ADMIN_LIMIT: RateLimitConfig = { maxRequests: 200, windowMs: 60_000 }
export const UPLOAD_LIMIT: RateLimitConfig = { maxRequests: 10, windowMs: 60_000 }

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs, limit: config.maxRequests }
  }

  entry.count++
  const remaining = Math.max(0, config.maxRequests - entry.count)
  return {
    allowed: entry.count <= config.maxRequests,
    remaining,
    resetAt: entry.resetAt,
    limit: config.maxRequests,
  }
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
