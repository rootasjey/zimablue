import { getMergedSocialAutopostConfig } from './social-provider-settings'

interface InstagramPostConfig {
  enabled: boolean
  accessToken: string
  userId: string
  baseUrl: string
  apiVersion: string
  pollIntervalMs: number
  pollTimeoutMs: number
}

interface ThreadsPostConfig {
  enabled: boolean
  accessToken: string
  userId: string
  baseUrl: string
  apiVersion: string
  pollIntervalMs: number
  pollTimeoutMs: number
}

interface FacebookPostConfig {
  enabled: boolean
  pageAccessToken: string
  pageId: string
  baseUrl: string
  apiVersion: string
}

export async function resolveInstagramPostConfig(runtimeConfig = useRuntimeConfig()): Promise<InstagramPostConfig> {
  const socialAutopost = await getMergedSocialAutopostConfig(runtimeConfig)
  const config = (socialAutopost.instagram || {}) as Record<string, any>
  return {
    enabled: Boolean(config.enabled),
    accessToken: String(config.accessToken || '').trim(),
    userId: String(config.userId || '').trim(),
    baseUrl: String(config.baseUrl || 'https://graph.facebook.com').replace(/\/$/, ''),
    apiVersion: String(config.apiVersion || 'v24.0').replace(/^\/+/, ''),
    pollIntervalMs: Math.max(1000, Number(config.pollIntervalMs || 5000)),
    pollTimeoutMs: Math.max(10000, Number(config.pollTimeoutMs || 300000)),
  }
}

export async function resolveThreadsPostConfig(runtimeConfig = useRuntimeConfig()): Promise<ThreadsPostConfig> {
  const socialAutopost = await getMergedSocialAutopostConfig(runtimeConfig)
  const config = (socialAutopost.threads || {}) as Record<string, any>
  return {
    enabled: Boolean(config.enabled),
    accessToken: String(config.accessToken || '').trim(),
    userId: String(config.userId || '').trim(),
    baseUrl: String(config.baseUrl || 'https://graph.threads.net').replace(/\/$/, ''),
    apiVersion: String(config.apiVersion || 'v1.0').replace(/^\/+/, ''),
    pollIntervalMs: Math.max(1000, Number(config.pollIntervalMs || 4000)),
    pollTimeoutMs: Math.max(10000, Number(config.pollTimeoutMs || 120000)),
  }
}

export async function resolveFacebookPostConfig(runtimeConfig = useRuntimeConfig()): Promise<FacebookPostConfig> {
  const socialAutopost = await getMergedSocialAutopostConfig(runtimeConfig)
  const config = (socialAutopost.facebook || {}) as Record<string, any>
  return {
    enabled: Boolean(config.enabled),
    pageAccessToken: String(config.pageAccessToken || '').trim(),
    pageId: String(config.pageId || '').trim(),
    baseUrl: String(config.baseUrl || 'https://graph.facebook.com').replace(/\/$/, ''),
    apiVersion: String(config.apiVersion || 'v25.0').replace(/^\/+/, ''),
  }
}
