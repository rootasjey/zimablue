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
  if (!storedState || storedState.type !== 'meta') {
    return sendRedirect(event, '/admin/social?error=Invalid or expired OAuth state')
  }

  await storage.removeItem(`admin:social:oauth:state:${state}`)

  const config = useRuntimeConfig(event)
  const storedConfig = await getStoredProviderConfig()
  const storedFacebook = storedConfig.facebook || {} as Record<string, unknown>
  const storedInstagram = storedConfig.instagram || {} as Record<string, unknown>

  const appId = String(storedFacebook.metaAppId || storedInstagram.metaAppId || config.metaOAuth?.appId || '').trim()
  const appSecret = String(storedFacebook.metaAppSecret || storedInstagram.metaAppSecret || config.metaOAuth?.appSecret || '').trim()
  if (!appId || !appSecret) {
    return sendRedirect(event, '/admin/social?error=Meta OAuth is not configured (missing App ID or Secret)')
  }

  const siteUrl = String(config.public?.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
  const redirectUri = `${siteUrl}/api/auth/meta/callback`
  const apiVersion = config.socialAutopost?.facebook?.apiVersion || 'v25.0'

  try {
    const shortToken = await exchangeMetaCode(code, redirectUri, appId, appSecret, apiVersion)
    const longToken = await exchangeMetaLongLivedToken(shortToken, appId, appSecret, apiVersion)

    const configuredPlatforms: string[] = []

    const fbResult = await configureFacebook(longToken, apiVersion)
    if (fbResult) {
      configuredPlatforms.push('facebook')
    }

    const igResult = await configureInstagram(longToken, apiVersion, fbResult?.pageId)
    if (igResult) {
      configuredPlatforms.push('instagram')
    }

    if (configuredPlatforms.length === 0) {
      return sendRedirect(event, '/admin/social?error=Could not find any Facebook Page or Instagram Business Account linked to this Meta app')
    }

    let params = `connected=${configuredPlatforms.join('+')}`
    if (configuredPlatforms.length === 1 && configuredPlatforms[0] === 'facebook') {
      params = 'connected=meta&partial=instagram'
    }

    return sendRedirect(event, `/admin/social?${params}`)
  } catch (err: any) {
    console.error('[meta-oauth-callback]', err)
    return sendRedirect(event, `/admin/social?error=${encodeURIComponent(err?.message || 'OAuth token exchange failed')}`)
  }
})

async function exchangeMetaCode(code: string, redirectUri: string, appId: string, appSecret: string, apiVersion: string): Promise<string> {
  const tokenUrl = new URL(`https://graph.facebook.com/${apiVersion}/oauth/access_token`)
  tokenUrl.searchParams.set('client_id', appId)
  tokenUrl.searchParams.set('redirect_uri', redirectUri)
  tokenUrl.searchParams.set('client_secret', appSecret)
  tokenUrl.searchParams.set('code', code)

  const res = await fetch(tokenUrl.toString(), { method: 'POST' })
  const body = await res.json() as { access_token?: string; error?: { message?: string } }

  if (!res.ok || !body.access_token) {
    throw new Error(body.error?.message || `Token exchange failed (${res.status})`)
  }

  return body.access_token
}

async function exchangeMetaLongLivedToken(shortToken: string, appId: string, appSecret: string, apiVersion: string): Promise<string> {
  const longUrl = new URL(`https://graph.facebook.com/${apiVersion}/oauth/access_token`)
  longUrl.searchParams.set('grant_type', 'fb_exchange_token')
  longUrl.searchParams.set('client_id', appId)
  longUrl.searchParams.set('client_secret', appSecret)
  longUrl.searchParams.set('fb_exchange_token', shortToken)

  const res = await fetch(longUrl.toString())
  const body = await res.json() as { access_token?: string; error?: { message?: string } }

  if (!res.ok || !body.access_token) {
    throw new Error(body.error?.message || `Long-lived token exchange failed (${res.status})`)
  }

  return body.access_token
}

async function configureFacebook(accessToken: string, apiVersion: string): Promise<{ pageId: string; pageAccessToken: string } | null> {
  const pagesUrl = new URL(`https://graph.facebook.com/${apiVersion}/me/accounts`)
  pagesUrl.searchParams.set('access_token', accessToken)
  pagesUrl.searchParams.set('limit', '10')

  const res = await fetch(pagesUrl.toString())
  const body = await res.json() as { data?: Array<{ id: string; name: string; access_token: string }>; error?: { message?: string } }

  if (!res.ok || !body.data || body.data.length === 0) {
    return null
  }

  const page = body.data[0]!
  const pageId = page.id
  const pageAccessToken = page.access_token

  const storedConfig = await getStoredProviderConfig()
  const nextConfig = {
    ...storedConfig,
    facebook: {
      ...(storedConfig.facebook || {}),
      enabled: true,
      pageAccessToken,
      pageId,
      baseUrl: 'https://graph.facebook.com',
      apiVersion,
    },
  }
  await saveProviderConfigToKv(nextConfig)

  return { pageId, pageAccessToken }
}

async function configureInstagram(accessToken: string, apiVersion: string, pageId?: string): Promise<boolean> {
  if (!pageId) {
    const storedConfig = await getStoredProviderConfig()
    pageId = storedConfig.facebook?.pageId as string | undefined
    if (!pageId) return false
  }

  const igUrl = new URL(`https://graph.facebook.com/${apiVersion}/${pageId}`)
  igUrl.searchParams.set('fields', 'instagram_business_account{id,username,name}')
  igUrl.searchParams.set('access_token', accessToken)

  const res = await fetch(igUrl.toString())
  const body = await res.json() as { instagram_business_account?: { id: string; username?: string; name?: string }; error?: { message?: string } }

  if (!res.ok || !body.instagram_business_account) {
    return false
  }

  const igId = body.instagram_business_account.id

  const storedConfig = await getStoredProviderConfig()
  const nextConfig = {
    ...storedConfig,
    instagram: {
      ...(storedConfig.instagram || {}),
      enabled: true,
      accessToken,
      userId: igId,
      baseUrl: 'https://graph.facebook.com',
      apiVersion,
      pollIntervalMs: 5000,
      pollTimeoutMs: 300000,
    },
  }
  await saveProviderConfigToKv(nextConfig)

  return true
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
