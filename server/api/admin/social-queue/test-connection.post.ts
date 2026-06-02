import { isAdminSession } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody<Record<string, unknown> | null>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid config payload' })
  }

  const service = String(body.service || 'https://bsky.social').replace(/\/$/, '')
  const identifier = String(body.identifier || '').trim().replace(/^@/, '')
  const password = String(body.password || '').trim()

  if (!identifier || !password) {
    return { success: false, error: 'Missing identifier or password' }
  }

  try {
    const sessionResponse = await fetch(`${service}/xrpc/com.atproto.server.createSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    })

    const sessionPayload = await sessionResponse.json().catch(() => null) as {
      accessJwt?: string
      did?: string
      handle?: string
      message?: string
      error?: string
    } | null

    if (!sessionResponse.ok || !sessionPayload?.accessJwt || !sessionPayload.did || !sessionPayload.handle) {
      return { success: false, error: sessionPayload?.message || sessionPayload?.error || `Session error (${sessionResponse.status})` }
    }

    return { success: true, handle: sessionPayload.handle, did: sessionPayload.did }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Connection failed' }
  }
})
