import type { SocialAutopostPlatform } from '@verbatims/social-autopost-core'
import { SOCIAL_AUTOPOST_PLATFORMS } from '@verbatims/social-autopost-core'
import { getDefaultEnabledPlatformCandidates, getMergedSocialAutopostConfig } from './social-provider-settings'

interface XProviderConfig {
  enabled: boolean
  oauth2AccessToken: string
  oauth1ConsumerKey: string
  oauth1ConsumerSecret: string
  oauth1AccessToken: string
  oauth1AccessTokenSecret: string
  requireMedia: boolean
}

interface BlueskyProviderConfig {
  enabled: boolean
  service: string
  identifier: string
  password: string
  hashtags: string
}

interface SimpleEnabledProviderConfig {
  enabled: boolean
}

export async function resolveXProviderConfig(runtimeConfig = useRuntimeConfig()): Promise<XProviderConfig> {
  const socialAutopost = await getMergedSocialAutopostConfig(runtimeConfig)
  const x = socialAutopost.x || {}

  return {
    enabled: Boolean(x.enabled),
    oauth2AccessToken: String(x.oauth2AccessToken || '').trim(),
    oauth1ConsumerKey: String(x.oauth1ConsumerKey || '').trim(),
    oauth1ConsumerSecret: String(x.oauth1ConsumerSecret || '').trim(),
    oauth1AccessToken: String(x.oauth1AccessToken || '').trim(),
    oauth1AccessTokenSecret: String(x.oauth1AccessTokenSecret || '').trim(),
    requireMedia: Boolean(x.requireMedia),
  }
}

export async function resolveBlueskyProviderConfig(runtimeConfig = useRuntimeConfig()): Promise<BlueskyProviderConfig> {
  const socialAutopost = await getMergedSocialAutopostConfig(runtimeConfig)
  const bluesky = socialAutopost.bluesky || {}

  return {
    enabled: Boolean(bluesky.enabled),
    service: String(bluesky.service || 'https://bsky.social').replace(/\/$/, ''),
    identifier: String(bluesky.identifier || '').trim(),
    password: String(bluesky.password || '').trim(),
    hashtags: String(bluesky.hashtags || '').trim(),
  }
}

export async function resolveInstagramEnabledConfig(runtimeConfig = useRuntimeConfig()): Promise<SimpleEnabledProviderConfig> {
  const socialAutopost = await getMergedSocialAutopostConfig(runtimeConfig)
  return { enabled: Boolean(socialAutopost.instagram?.enabled) }
}

export async function resolveThreadsEnabledConfig(runtimeConfig = useRuntimeConfig()): Promise<SimpleEnabledProviderConfig> {
  const socialAutopost = await getMergedSocialAutopostConfig(runtimeConfig)
  return { enabled: Boolean(socialAutopost.threads?.enabled) }
}

export async function resolveFacebookEnabledConfig(runtimeConfig = useRuntimeConfig()): Promise<SimpleEnabledProviderConfig> {
  const socialAutopost = await getMergedSocialAutopostConfig(runtimeConfig)
  return { enabled: Boolean(socialAutopost.facebook?.enabled) }
}

export async function getEnabledSocialAutopostPlatforms(runtimeConfig = useRuntimeConfig()): Promise<SocialAutopostPlatform[]> {
  const socialAutopost = await getMergedSocialAutopostConfig(runtimeConfig)
  const requested = new Set(getDefaultEnabledPlatformCandidates(socialAutopost))
  const enabled = new Set<SocialAutopostPlatform>()

  if (requested.has('x') && (await resolveXProviderConfig(runtimeConfig)).enabled) {
    enabled.add('x')
  }

  if (requested.has('bluesky') && (await resolveBlueskyProviderConfig(runtimeConfig)).enabled) {
    enabled.add('bluesky')
  }

  if (requested.has('instagram') && (await resolveInstagramEnabledConfig(runtimeConfig)).enabled) {
    enabled.add('instagram')
  }

  if (requested.has('threads') && (await resolveThreadsEnabledConfig(runtimeConfig)).enabled) {
    enabled.add('threads')
  }

  if (requested.has('facebook') && (await resolveFacebookEnabledConfig(runtimeConfig)).enabled) {
    enabled.add('facebook')
  }

  return SOCIAL_AUTOPOST_PLATFORMS.filter(platform => enabled.has(platform))
}