import { isAdminSession } from '../../../../utils/auth'
import { isSocialAdminProviderPlatform, saveSocialProviderConfig } from '../../../../utils/social-provider-settings'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const platform = String(getRouterParam(event, 'platform') || '')
  if (!isSocialAdminProviderPlatform(platform)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid provider platform' })
  }

  const body = await readBody<Record<string, unknown> | null>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid provider config payload' })
  }

  const config = await saveSocialProviderConfig(platform, body)

  return {
    success: true,
    data: {
      platform,
      storage: 'kv',
      config,
    }
  }
})