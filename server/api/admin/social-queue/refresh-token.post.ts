import { isAdminSession } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody<Record<string, unknown> | null>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }

  const platform = String(body.platform || '').trim()

  if (platform === 'threads') {
    return refreshThreadsToken(body)
  }

  if (platform === 'meta') {
    return refreshMetaToken(body)
  }

  return { success: false, error: 'Token refresh not supported for this platform' }
})

async function refreshThreadsToken(body: Record<string, unknown>) {
  const accessToken = String(body.accessToken || '').trim()
  const apiVersion = String(body.apiVersion || 'v1.0').trim()

  if (!accessToken) {
    return { success: false, error: 'Missing access token' }
  }

  try {
    const refreshUrl = new URL(`https://graph.threads.net/${apiVersion}/refresh_access_token`)
    refreshUrl.searchParams.set('grant_type', 'th_refresh_token')
    refreshUrl.searchParams.set('access_token', accessToken)

    const res = await fetch(refreshUrl.toString())
    const payload = await res.json() as {
      access_token?: string
      token_type?: string
      expires_in?: number
      error?: { message?: string; code?: number }
    }

    if (!res.ok || !payload.access_token) {
      if (payload.error?.message) {
        return { success: false, error: payload.error.message }
      }
      return { success: false, error: `Token refresh failed (${res.status})` }
    }

    return { success: true, accessToken: payload.access_token }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Connection failed' }
  }
}

async function refreshMetaToken(body: Record<string, unknown>) {
  const accessToken = String(body.accessToken || '').trim()
  const appId = String(body.appId || '').trim()
  const appSecret = String(body.appSecret || '').trim()
  const apiVersion = String(body.apiVersion || 'v25.0').trim()

  if (!accessToken) {
    return { success: false, error: 'Missing access token' }
  }

  if (!appId || !appSecret) {
    return { success: false, error: 'Missing Meta App ID or App Secret' }
  }

  try {
    const refreshUrl = new URL(`https://graph.facebook.com/${apiVersion}/oauth/access_token`)
    refreshUrl.searchParams.set('grant_type', 'fb_exchange_token')
    refreshUrl.searchParams.set('client_id', appId)
    refreshUrl.searchParams.set('client_secret', appSecret)
    refreshUrl.searchParams.set('fb_exchange_token', accessToken)

    const res = await fetch(refreshUrl.toString())
    const payload = await res.json() as {
      access_token?: string
      token_type?: string
      expires_in?: number
      error?: { message?: string; code?: number }
    }

    if (!res.ok || !payload.access_token) {
      if (payload.error?.message) {
        return { success: false, error: payload.error.message }
      }
      return { success: false, error: `Token refresh failed (${res.status})` }
    }

    return { success: true, accessToken: payload.access_token }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Connection failed' }
  }
}
