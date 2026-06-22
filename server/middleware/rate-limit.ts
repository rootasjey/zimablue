import { checkRateLimit, getClientIp, applyRateLimitHeaders, PUBLIC_LIMIT, AUTH_LIMIT, ADMIN_LIMIT, UPLOAD_LIMIT } from '../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const path = event.path || event.node?.req?.url || ''

  if (!path.startsWith('/api/')) return

  const ip = getClientIp(event)
  const key = `${ip}:${path}`

  // Different limits per route
  let config: { maxRequests: number; windowMs: number }
  if (path.startsWith('/api/admin/')) {
    config = ADMIN_LIMIT
  } else if (path.startsWith('/api/images/') && path.includes('/upload')) {
    config = UPLOAD_LIMIT
  } else if (path === '/api/login' || path === '/api/register') {
    config = AUTH_LIMIT
  } else {
    config = PUBLIC_LIMIT
  }

  const result = checkRateLimit(key, config)
  applyRateLimitHeaders(event, result)

  if (!result.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)}s.`,
    })
  }
})
