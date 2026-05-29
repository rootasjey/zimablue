import { sendRedirect } from 'h3'
import { getStoredSocialProviderConfig } from '../../../../../utils/social-provider-settings'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const config = useRuntimeConfig(event)
  const storedConfig = await getStoredSocialProviderConfig()
  const storedFacebook = storedConfig.facebook || {} as Record<string, unknown>
  const storedInstagram = storedConfig.instagram || {} as Record<string, unknown>

  const appId = String(storedFacebook.metaAppId || storedInstagram.metaAppId || config.metaOAuth?.appId || '').trim()
  if (!appId) {
    throw createError({ statusCode: 400, message: 'Meta App ID is not configured. Set it via .env (NUXT_META_APP_ID) or in the Facebook/Instagram provider config dialog.' })
  }

  const siteUrl = String(config.public?.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
  const redirectUri = `${siteUrl}/api/auth/meta/callback`
  const apiVersion = config.socialAutopost?.facebook?.apiVersion || 'v25.0'
  const scopes = ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish'].join(',')

  const nonce = crypto.randomUUID()
  const storage = useStorage('kv')
  await storage.setItem(`admin:social:oauth:state:${nonce}`, { type: 'meta' })

  const authUrl = new URL(`https://www.facebook.com/${apiVersion}/dialog/oauth`)
  authUrl.searchParams.set('client_id', appId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', nonce)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('response_type', 'code')

  return sendRedirect(event, authUrl.toString())
})
