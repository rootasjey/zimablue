import type { SocialAutopostPlatform } from '@verbatims/social-autopost-core'

declare function hubKV(): {
  get<T = unknown>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
}

export const SOCIAL_ADMIN_PROVIDER_PLATFORMS = ['x', 'bluesky', 'instagram', 'threads', 'facebook'] as const

export type SocialAdminProviderPlatform = typeof SOCIAL_ADMIN_PROVIDER_PLATFORMS[number]

export interface SocialProviderKVConfig {
  x?: Record<string, unknown>
  bluesky?: Record<string, unknown>
  instagram?: Record<string, unknown>
  threads?: Record<string, unknown>
  facebook?: Record<string, unknown>
}

const SOCIAL_PROVIDER_KV_KEY = 'admin:social:provider-config'

export function isSocialAdminProviderPlatform(value: unknown): value is SocialAdminProviderPlatform {
  return typeof value === 'string' && SOCIAL_ADMIN_PROVIDER_PLATFORMS.includes(value as SocialAdminProviderPlatform)
}

export async function getStoredSocialProviderConfig(): Promise<SocialProviderKVConfig> {
  const storage = await getSocialProviderStorage()
  const value = await storage.get<SocialProviderKVConfig>(SOCIAL_PROVIDER_KV_KEY)
  return isRecord(value) ? (value as SocialProviderKVConfig) : {}
}

export async function getMergedSocialAutopostConfig(runtimeConfig = useRuntimeConfig()): Promise<Record<string, any>> {
  const baseConfig = cloneRecord((runtimeConfig.socialAutopost || {}) as Record<string, any>)
  const storedConfig = await getStoredSocialProviderConfig()
  return mergeRecords(baseConfig, storedConfig as Record<string, any>)
}

export async function hasStoredSocialProviderConfig(platform: SocialAdminProviderPlatform): Promise<boolean> {
  const storedConfig = await getStoredSocialProviderConfig()
  return isRecord(storedConfig[platform])
}

export async function saveSocialProviderConfig(platform: SocialAdminProviderPlatform, input: Record<string, unknown>) {
  const storedConfig = await getStoredSocialProviderConfig()
  const nextConfig: SocialProviderKVConfig = {
    ...storedConfig,
    [platform]: sanitizeProviderConfig(platform, input),
  }

  const storage = await getSocialProviderStorage()
  await storage.set(SOCIAL_PROVIDER_KV_KEY, nextConfig)

  return nextConfig[platform] || {}
}

export function getDefaultEnabledPlatformCandidates(config: Record<string, any>): SocialAutopostPlatform[] {
  const configured = Array.isArray(config.enabledPlatforms)
    ? config.enabledPlatforms.map((value: unknown) => String(value)).filter(isSocialAutopostPlatform)
    : []

  if (configured.length) {
    return configured
  }

  return [...SOCIAL_ADMIN_PROVIDER_PLATFORMS]
}

async function getSocialProviderStorage() {
  try {
    const kv = hubKV()
    return {
      async get<T>(key: string): Promise<T | null> {
        return (await kv.get(key)) as T | null
      },
      async set(key: string, value: unknown) {
        await kv.set(key, value)
      },
    }
  } catch {
    const storage = useStorage('social-provider-config')
    return {
      async get<T>(key: string): Promise<T | null> {
        return (await storage.getItem(key)) as T | null
      },
      async set(key: string, value: unknown) {
        await storage.setItem(key, value as any)
      },
    }
  }
}

function sanitizeProviderConfig(platform: SocialAdminProviderPlatform, input: Record<string, unknown>): Record<string, unknown> {
  if (platform === 'x') {
    return {
      enabled: Boolean(input.enabled),
      oauth2AccessToken: asTrimmedString(input.oauth2AccessToken),
      oauth1ConsumerKey: asTrimmedString(input.oauth1ConsumerKey),
      oauth1ConsumerSecret: asTrimmedString(input.oauth1ConsumerSecret),
      oauth1AccessToken: asTrimmedString(input.oauth1AccessToken),
      oauth1AccessTokenSecret: asTrimmedString(input.oauth1AccessTokenSecret),
      requireMedia: Boolean(input.requireMedia),
    }
  }

  if (platform === 'bluesky') {
    return {
      enabled: Boolean(input.enabled),
      service: asTrimmedString(input.service) || 'https://bsky.social',
      identifier: asTrimmedString(input.identifier),
      password: asTrimmedString(input.password),
      hashtags: asTrimmedString(input.hashtags),
    }
  }

  if (platform === 'instagram') {
    return {
      enabled: Boolean(input.enabled),
      accessToken: asTrimmedString(input.accessToken),
      userId: asTrimmedString(input.userId),
      baseUrl: asTrimmedString(input.baseUrl) || 'https://graph.facebook.com',
      apiVersion: asTrimmedString(input.apiVersion) || 'v24.0',
      pollIntervalMs: asPositiveNumber(input.pollIntervalMs, 5000),
      pollTimeoutMs: asPositiveNumber(input.pollTimeoutMs, 300000),
    }
  }

  if (platform === 'threads') {
    return {
      enabled: Boolean(input.enabled),
      accessToken: asTrimmedString(input.accessToken),
      userId: asTrimmedString(input.userId),
      baseUrl: asTrimmedString(input.baseUrl) || 'https://graph.threads.net',
      apiVersion: asTrimmedString(input.apiVersion) || 'v1.0',
      pollIntervalMs: asPositiveNumber(input.pollIntervalMs, 4000),
      pollTimeoutMs: asPositiveNumber(input.pollTimeoutMs, 120000),
    }
  }

  return {
    enabled: Boolean(input.enabled),
    pageAccessToken: asTrimmedString(input.pageAccessToken),
    pageId: asTrimmedString(input.pageId),
    baseUrl: asTrimmedString(input.baseUrl) || 'https://graph.facebook.com',
    apiVersion: asTrimmedString(input.apiVersion) || 'v25.0',
  }
}

function mergeRecords(base: Record<string, any>, override: Record<string, any>) {
  const result: Record<string, any> = { ...base }

  for (const [key, value] of Object.entries(override)) {
    if (isRecord(value) && isRecord(result[key])) {
      result[key] = mergeRecords(result[key], value)
      continue
    }

    result[key] = cloneValue(value)
  }

  return result
}

function cloneRecord(value: Record<string, any>) {
  return mergeRecords({}, value)
}

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cloneValue)
  }

  if (isRecord(value)) {
    return mergeRecords({}, value)
  }

  return value
}

function asTrimmedString(value: unknown): string {
  return String(value || '').trim()
}

function asPositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSocialAutopostPlatform(value: string): value is SocialAutopostPlatform {
  return (SOCIAL_ADMIN_PROVIDER_PLATFORMS as readonly string[]).includes(value)
}