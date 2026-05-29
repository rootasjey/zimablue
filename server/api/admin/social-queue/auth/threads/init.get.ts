import { sendRedirect } from 'h3'
import { getStoredSocialProviderConfig } from '../../../../../utils/social-provider-settings'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const config = useRuntimeConfig(event)
  const storedConfig = await getStoredSocialProviderConfig()
  const storedThreads = storedConfig.threads || {} as Record<string, unknown>

  const appId = String(storedThreads.appId || config.threadsOAuth?.appId || '').trim()
  if (!appId) {
    throw createError({ statusCode: 400, message: 'Threads App ID is not configured. Set it via .env (NUXT_THREADS_APP_ID) or in the Threads provider config dialog.' })
  }

  const siteUrl = String(config.public?.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
  const redirectUri = `${siteUrl}/api/auth/threads/callback`
  const scopes = ['threads_basic', 'threads_content_publish'].join(',')

  const nonce = crypto.randomUUID()
  const storage = useStorage('kv')
  await storage.setItem(`admin:social:oauth:state:${nonce}`, { type: 'threads' })

  const authUrl = new URL('https://www.threads.net/oauth/authorize')
  authUrl.searchParams.set('client_id', appId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', nonce)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('response_type', 'code')

  return sendRedirect(event, authUrl.toString())
})
