import { sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string | undefined
  const state = query.state as string | undefined
  const error = query.error as string | undefined

  if (error === 'access_denied') {
    return sendRedirect(event, '/admin/social?error=Authorization was denied')
  }
  if (error) {
    return sendRedirect(event, `/admin/social?error=${encodeURIComponent(String(error))}`)
  }
  if (!code || !state) {
    return sendRedirect(event, '/admin/social?error=Missing OAuth code or state')
  }

  const storage = useStorage('kv')
  const storedState = await storage.getItem<{ type: string }>(`admin:social:oauth:state:${state}`)
  if (!storedState || storedState.type !== 'threads') {
    return sendRedirect(event, '/admin/social?error=Invalid or expired OAuth state')
  }

  await storage.removeItem(`admin:social:oauth:state:${state}`)

  const config = useRuntimeConfig(event)
  const storedConfig = await getStoredProviderConfig()
  const storedThreads = storedConfig.threads || {} as Record<string, unknown>

  const appId = String(storedThreads.appId || config.threadsOAuth?.appId || '').trim()
  const appSecret = String(storedThreads.appSecret || config.threadsOAuth?.appSecret || '').trim()
  if (!appId || !appSecret) {
    return sendRedirect(event, '/admin/social?error=Threads OAuth is not configured (missing App ID or Secret)')
  }

  const siteUrl = String(config.public?.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
  const redirectUri = `${siteUrl}/api/auth/threads/callback`
  const apiVersion = config.socialAutopost?.threads?.apiVersion || 'v1.0'

  try {
    const shortToken = await exchangeThreadsCode(code, redirectUri, appId, appSecret)
    const longToken = await exchangeThreadsLongLivedToken(shortToken, appId, appSecret)
    const userId = await getThreadsUserId(longToken, apiVersion)

    const storedConfig = await getStoredProviderConfig()
    const nextConfig = {
      ...storedConfig,
      threads: {
        ...(storedConfig.threads || {}),
        enabled: true,
        accessToken: longToken,
        userId,
        baseUrl: 'https://graph.threads.net',
        apiVersion,
        pollIntervalMs: 4000,
        pollTimeoutMs: 120000,
        appId,
        appSecret,
      },
    }
    await saveProviderConfigToKv(nextConfig)

    return sendRedirect(event, '/admin/social?connected=threads')
  } catch (err: any) {
    console.error('[threads-oauth-callback]', err)
    return sendRedirect(event, `/admin/social?error=${encodeURIComponent(err?.message || 'Threads OAuth token exchange failed')}`)
  }
})

async function exchangeThreadsCode(code: string, redirectUri: string, appId: string, appSecret: string): Promise<string> {
  const tokenUrl = new URL('https://graph.threads.net/oauth/access_token')
  tokenUrl.searchParams.set('client_id', appId)
  tokenUrl.searchParams.set('redirect_uri', redirectUri)
  tokenUrl.searchParams.set('client_secret', appSecret)
  tokenUrl.searchParams.set('code', code)

  const res = await fetch(tokenUrl.toString(), { method: 'POST' })
  const body = await res.json() as { access_token?: string; error?: { message?: string } }

  if (!res.ok || !body.access_token) {
    throw new Error(body.error?.message || `Threads token exchange failed (${res.status})`)
  }

  return body.access_token
}

async function exchangeThreadsLongLivedToken(shortToken: string, appId: string, appSecret: string): Promise<string> {
  const tokenUrl = new URL('https://graph.threads.net/access_token')
  tokenUrl.searchParams.set('grant_type', 'th_exchange_token')
  tokenUrl.searchParams.set('client_id', appId)
  tokenUrl.searchParams.set('client_secret', appSecret)
  tokenUrl.searchParams.set('access_token', shortToken)

  const res = await fetch(tokenUrl.toString())
  const body = await res.json() as { access_token?: string; error?: { message?: string } }

  if (!res.ok || !body.access_token) {
    throw new Error(body.error?.message || `Threads long-lived token exchange failed (${res.status})`)
  }

  return body.access_token
}

async function getThreadsUserId(accessToken: string, apiVersion: string): Promise<string> {
  const meUrl = new URL(`https://graph.threads.net/${apiVersion}/me`)
  meUrl.searchParams.set('access_token', accessToken)
  meUrl.searchParams.set('fields', 'id')

  const res = await fetch(meUrl.toString())
  const body = await res.json() as { id?: string; error?: { message?: string } }

  if (!res.ok || !body.id) {
    throw new Error(body.error?.message || 'Failed to get Threads user ID')
  }

  return body.id
}

async function getStoredProviderConfig(): Promise<Record<string, any>> {
  const storage = useStorage('kv')
  const value = await storage.getItem('admin:social:provider-config') as Record<string, any> | null
  return value || {}
}

async function saveProviderConfigToKv(config: Record<string, any>) {
  const storage = useStorage('kv')
  await storage.setItem('admin:social:provider-config', config)
}
