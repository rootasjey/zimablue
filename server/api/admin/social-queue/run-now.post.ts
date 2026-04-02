import { isAdminSession } from '../../../utils/auth'
import { getSocialAutopostPlatformError, isSocialAutopostPlatform, runSocialAutopostWithOptions } from '../../../utils/social-autopost'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody(event)
  const platformInput = body?.platform ? String(body.platform) : undefined

  if (platformInput && !isSocialAutopostPlatform(platformInput)) {
    throw createError({ statusCode: 400, statusMessage: getSocialAutopostPlatformError() })
  }

  const platform = platformInput && isSocialAutopostPlatform(platformInput)
    ? platformInput
    : undefined

  const configuredBaseSiteUrl = String(useRuntimeConfig().public.siteUrl || '').trim().replace(/\/$/, '')
  const requestBaseSiteUrl = getRequestURL(event).origin.replace(/\/$/, '')
  const baseSiteUrl = configuredBaseSiteUrl || requestBaseSiteUrl

  try {
    const result = await runSocialAutopostWithOptions({
      force: true,
      platform,
      baseSiteUrl,
    })

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error('[social-queue/run-now] failed', {
      platform,
      baseSiteUrl,
      message: error?.message || error,
    })

    return {
      success: true,
      data: {
        success: false,
        reason: error?.message || 'Unexpected error while running social autopost',
      }
    }
  }
})