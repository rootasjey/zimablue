import { isAdminSession } from '../../../../utils/auth'
import { resolveFacebookPostConfig, resolveInstagramPostConfig, resolveThreadsPostConfig } from '../../../../utils/social-meta-config'
import { hasStoredSocialProviderConfig, isSocialAdminProviderPlatform } from '../../../../utils/social-provider-settings'
import { getXAuthConfig } from '../../../../utils/social-x-auth'
import { resolveBlueskyProviderConfig, resolveXProviderConfig } from '../../../../utils/social-provider-config'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const platform = String(getRouterParam(event, 'platform') || '')
  if (!isSocialAdminProviderPlatform(platform)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid provider platform' })
  }

  if (platform === 'x') {
    const config = await resolveXProviderConfig()
    const auth = getXAuthConfig({
      oauth2AccessToken: config.oauth2AccessToken,
      oauth1ConsumerKey: config.oauth1ConsumerKey,
      oauth1ConsumerSecret: config.oauth1ConsumerSecret,
      oauth1AccessToken: config.oauth1AccessToken,
      oauth1AccessTokenSecret: config.oauth1AccessTokenSecret,
    })

    return {
      success: true,
      data: {
        platform,
        storage: (await hasStoredSocialProviderConfig(platform)) ? 'kv' : 'runtime',
        configured: auth.mode !== 'none',
        config,
      }
    }
  }

  if (platform === 'bluesky') {
    const config = await resolveBlueskyProviderConfig()
    return {
      success: true,
      data: {
        platform,
        storage: (await hasStoredSocialProviderConfig(platform)) ? 'kv' : 'runtime',
        configured: Boolean(config.identifier && config.password),
        config,
      }
    }
  }

  if (platform === 'instagram') {
    const config = await resolveInstagramPostConfig()
    return {
      success: true,
      data: {
        platform,
        storage: (await hasStoredSocialProviderConfig(platform)) ? 'kv' : 'runtime',
        configured: Boolean(config.accessToken && config.userId),
        config,
      }
    }
  }

  if (platform === 'threads') {
    const config = await resolveThreadsPostConfig()
    return {
      success: true,
      data: {
        platform,
        storage: (await hasStoredSocialProviderConfig(platform)) ? 'kv' : 'runtime',
        configured: Boolean(config.accessToken && config.userId),
        config,
      }
    }
  }

  const config = await resolveFacebookPostConfig()
  return {
    success: true,
    data: {
      platform,
      storage: (await hasStoredSocialProviderConfig(platform)) ? 'kv' : 'runtime',
      configured: Boolean(config.pageAccessToken && config.pageId),
      config,
    }
  }
})