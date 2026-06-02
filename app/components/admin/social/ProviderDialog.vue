<template>
  <NDialog v-model:open="dialogOpen" :_dialogContent="{ class: 'max-w-2xl max-h-[calc(100vh-100px)] overflow-y-hidden' }">
    <template #header>
      <div class="flex items-start justify-between gap-4 px-2">
        <div>
          <span class="text-sm font-medium uppercase tracking-[0.18em] text-stone-600 dark:text-zinc-300">
            Provider config:
          </span>
          <span class="text-sm font-700 uppercase tracking-[0.18em]">
            {{ activeProviderLabel }}
          </span>
          <p class="mt-1 text-sm text-stone-400 dark:text-zinc-400">Saved to {{ providerDialogStorageLabel }}. Runtime values stay as the fallback.</p>
        </div>
      </div>
    </template>

    <div class="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto px-2 pt-4 pb-24">
      <!-- OAuth connect section (Meta for facebook/instagram, Threads for threads) -->
      <template v-if="!isLoading && (dialogPlatform === 'facebook' || dialogPlatform === 'instagram' || dialogPlatform === 'threads')">
        <div class="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-4 dark:border-blue-700/30 dark:bg-blue-900/10">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-xs font-medium uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
                {{ dialogPlatform === 'threads' ? 'Threads OAuth' : 'Meta OAuth' }}
              </p>
              <h4 class="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {{ dialogPlatform === 'threads' ? 'Connect with Threads' : 'Connect with Meta' }}
              </h4>
              <p class="mt-1 text-xs leading-5 text-stone-500 dark:text-zinc-400">
                <template v-if="dialogPlatform === 'threads'">
                  One-click authentication. You'll be redirected to Threads to authorize this app.
                </template>
                <template v-else>
                  One-click authentication for both Facebook and Instagram. You'll be redirected to Meta to authorize this app. Requires a Meta App with <code class="rounded bg-blue-100/60 px-1 py-0.5 text-[11px] font-mono dark:bg-blue-900/30">pages_manage_posts</code>, <code class="rounded bg-blue-100/60 px-1 py-0.5 text-[11px] font-mono dark:bg-blue-900/30">instagram_basic</code> and <code class="rounded bg-blue-100/60 px-1 py-0.5 text-[11px] font-mono dark:bg-blue-900/30">instagram_content_publish</code> scopes.
                </template>
              </p>
            </div>
            <button
              type="button"
              class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.97]"
              @click="startOAuthFlow(dialogPlatform)"
            >
              <span class="i-ph-plugs-connected text-sm"></span>
              Connect
            </button>
          </div>
        </div>
      </template>

      <div v-if="isLoading" class="flex items-center gap-2 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">
        <span class="i-ph-spinner-gap animate-spin"></span>
        Loading provider configuration...
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div v-for="field in providerFields" :key="field.key" class="sm:col-span-1" :class="field.fullWidth ? 'sm:col-span-2' : ''">
          <template v-if="field.type === 'toggle'">
            <label class="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 px-4 py-3 dark:border-zinc-700">
              <div>
                <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ field.label }}</p>
                <p v-if="field.help" class="mt-1 text-xs text-stone-500 dark:text-zinc-400">{{ field.help }}</p>
              </div>
              <input type="checkbox" class="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500/30 dark:border-zinc-600" :checked="Boolean(providerForm[field.key])" @change="updateProviderBooleanField(field.key, ($event.target as HTMLInputElement).checked)">
            </label>
          </template>

          <template v-else>
            <label class="space-y-1.5">
              <span class="text-xs font-medium text-stone-500 dark:text-zinc-400">{{ field.label }}</span>
              <input
                :type="field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'"
                :placeholder="field.placeholder || ''"
                :value="formatProviderFieldValue(field.key)"
                class="h-11 w-full rounded-2xl border border-stone-200 bg-stone-100 px-3 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                @input="updateProviderField(field.key, field.type === 'number' ? Number(($event.target as HTMLInputElement).value) : ($event.target as HTMLInputElement).value)"
              >
              <p v-if="field.help" class="text-xs leading-5 text-stone-400 dark:text-zinc-500">{{ field.help }}</p>
            </label>
          </template>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-xs text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">
        <span>{{ providerDialogConfigured ? 'Provider is configured.' : 'Provider still needs setup.' }}</span>
        <span>{{ providerDialogStorageLabel }}</span>
      </div>

      <!-- Refresh Token (Threads, Facebook, Instagram) -->
      <div v-if="dialogPlatform === 'threads' || dialogPlatform === 'facebook' || dialogPlatform === 'instagram'" class="rounded-2xl border border-dashed border-stone-200 p-4 dark:border-zinc-700">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-[0.15em] text-stone-500 dark:text-zinc-400">
              Access token
            </p>
            <p class="mt-0.5 text-sm text-stone-600 dark:text-zinc-300">
              <template v-if="refreshTokenStatus === 'success'">
                <span class="i-ph-check-circle text-green-500"></span>
                Token refreshed successfully
              </template>
              <template v-else-if="refreshTokenStatus === 'error'">
                <span class="i-ph-x-circle text-red-500"></span>
                {{ refreshTokenError }}
              </template>
              <template v-else>
                Token expires after 60 days. Refresh before it expires.
              </template>
            </p>
          </div>
          <button
            type="button"
            class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50 active:scale-[0.97] disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            :disabled="isRefreshingToken"
            @click="refreshToken"
          >
            <span v-if="isRefreshingToken" class="i-ph-spinner-gap animate-spin"></span>
            <span v-else class="i-ph-arrow-clockwise text-sm"></span>
            {{ isRefreshingToken ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <!-- Test Connection (Bluesky only) -->
      <div v-if="dialogPlatform === 'bluesky'" class="rounded-2xl border border-dashed border-stone-200 p-4 dark:border-zinc-700">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-[0.15em] text-stone-500 dark:text-zinc-400">
              Test credentials
            </p>
            <p class="mt-0.5 text-sm text-stone-600 dark:text-zinc-300">
              <template v-if="testConnectionStatus === 'success'">
                <span class="i-ph-check-circle text-green-500"></span>
                Connected as <code class="rounded bg-green-100 px-1 py-0.5 text-xs font-mono text-green-700 dark:bg-green-900/30 dark:text-green-300">{{ testConnectionHandle }}</code>
              </template>
              <template v-else-if="testConnectionStatus === 'error'">
                <span class="i-ph-x-circle text-red-500"></span>
                {{ testConnectionError }}
              </template>
              <template v-else>
                Verify your identifier and app password before saving.
              </template>
            </p>
          </div>
          <button
            type="button"
            class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50 active:scale-[0.97] disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            :disabled="isTestingConnection"
            @click="testConnection"
          >
            <span v-if="isTestingConnection" class="i-ph-spinner-gap animate-spin"></span>
            <span v-else class="i-ph-plug text-sm"></span>
            {{ isTestingConnection ? 'Testing...' : 'Test' }}
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <button class="h-10 rounded-xl bg-stone-100 px-4 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700" @click="dialogOpen = false">Cancel</button>
        <button class="h-10 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60" :disabled="isSaving" @click="saveProviderConfig">
          <span v-if="isSaving" class="mr-1.5 inline-block animate-spin i-ph-spinner-gap"></span>
          Save configuration
        </button>
      </div>
    </template>
  </NDialog>
</template>

<script lang="ts" setup>
type Platform = 'x' | 'bluesky' | 'instagram' | 'threads' | 'facebook'
type ProviderStorage = 'kv' | 'runtime'

interface ProviderField {
  key: keyof ProviderFormState
  label: string
  type: 'text' | 'password' | 'number' | 'toggle'
  placeholder?: string
  help?: string
  fullWidth?: boolean
}

interface ProviderConfigResponse {
  success: boolean
  data: {
    platform: Platform
    storage: ProviderStorage
    configured: boolean
    config: Partial<ProviderFormState>
  }
}

interface ProviderFormState {
  enabled: boolean
  requireMedia: boolean
  service: string
  identifier: string
  password: string
  hashtags: string
  oauth2AccessToken: string
  oauth1ConsumerKey: string
  oauth1ConsumerSecret: string
  oauth1AccessToken: string
  oauth1AccessTokenSecret: string
  accessToken: string
  userId: string
  baseUrl: string
  apiVersion: string
  pollIntervalMs: number
  pollTimeoutMs: number
  pageAccessToken: string
  pageId: string
  metaAppId: string
  metaAppSecret: string
  appId: string
  appSecret: string
}

interface Props {
  open: boolean
  defaultPlatform: Platform
  platformOptions: Array<{ value: Platform, label: string, icon: string }>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const dialogOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

const dialogPlatform = ref<Platform>(props.defaultPlatform)
const isLoading = ref(false)
const isSaving = ref(false)
const isTestingConnection = ref(false)
const testConnectionStatus = ref<'idle' | 'success' | 'error'>('idle')
const testConnectionHandle = ref('')
const testConnectionError = ref('')
const isRefreshingToken = ref(false)
const refreshTokenStatus = ref<'idle' | 'success' | 'error'>('idle')
const refreshTokenError = ref('')
const providerDialogStorage = ref<ProviderStorage>('runtime')
const providerDialogConfigured = ref(false)
const providerForm = reactive<ProviderFormState>(getEmptyProviderForm())

const activeProviderLabel = computed(() => props.platformOptions.find(option => option.value === dialogPlatform.value)?.label || dialogPlatform.value)

const providerFieldMap: Record<Platform, ProviderField[]> = {
  x: [
    { key: 'enabled', label: 'Enable X autopost', type: 'toggle', help: 'Use this provider in the daily queue once credentials are valid.', fullWidth: true },
    { key: 'requireMedia', label: 'Require media upload', type: 'toggle', help: 'Fail instead of posting text-only when media upload fails.', fullWidth: true },
    { key: 'oauth2AccessToken', label: 'OAuth 2 access token', type: 'password', placeholder: 'User access token', fullWidth: true },
    { key: 'oauth1ConsumerKey', label: 'OAuth 1 consumer key', type: 'text' },
    { key: 'oauth1ConsumerSecret', label: 'OAuth 1 consumer secret', type: 'password' },
    { key: 'oauth1AccessToken', label: 'OAuth 1 access token', type: 'password' },
    { key: 'oauth1AccessTokenSecret', label: 'OAuth 1 access token secret', type: 'password' },
  ],
  bluesky: [
    { key: 'enabled', label: 'Enable Bluesky autopost', type: 'toggle', fullWidth: true },
    { key: 'service', label: 'Service URL', type: 'text', placeholder: 'https://bsky.social' },
    { key: 'identifier', label: 'Identifier', type: 'text', placeholder: 'handle or email' },
    { key: 'password', label: 'App password', type: 'password' },
    { key: 'hashtags', label: 'Default hashtags', type: 'text', placeholder: '#art #illustration', help: 'Merged with image tags and trimmed for Bluesky.', fullWidth: true },
  ],
  instagram: [
    { key: 'enabled', label: 'Enable Instagram autopost', type: 'toggle', fullWidth: true },
    { key: 'accessToken', label: 'Access token', type: 'password', fullWidth: true },
    { key: 'userId', label: 'Business account id', type: 'text' },
    { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://graph.facebook.com' },
    { key: 'apiVersion', label: 'API version', type: 'text', placeholder: 'v24.0' },
    { key: 'pollIntervalMs', label: 'Poll interval (ms)', type: 'number' },
    { key: 'pollTimeoutMs', label: 'Poll timeout (ms)', type: 'number' },
    { key: 'metaAppId', label: 'Meta App ID', type: 'text', help: 'Used by the Connect with Meta OAuth flow.', fullWidth: true },
    { key: 'metaAppSecret', label: 'Meta App Secret', type: 'password', help: 'Used by the Connect with Meta OAuth flow.', fullWidth: true },
  ],
  threads: [
    { key: 'enabled', label: 'Enable Threads autopost', type: 'toggle', fullWidth: true },
    { key: 'accessToken', label: 'Access token', type: 'password', fullWidth: true },
    { key: 'userId', label: 'Threads user id', type: 'text' },
    { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://graph.threads.net' },
    { key: 'apiVersion', label: 'API version', type: 'text', placeholder: 'v1.0' },
    { key: 'pollIntervalMs', label: 'Poll interval (ms)', type: 'number' },
    { key: 'pollTimeoutMs', label: 'Poll timeout (ms)', type: 'number' },
    { key: 'appId', label: 'Threads App ID', type: 'text', help: 'Used by the Connect with Threads OAuth flow.', fullWidth: true },
    { key: 'appSecret', label: 'Threads App Secret', type: 'password', help: 'Used by the Connect with Threads OAuth flow.', fullWidth: true },
  ],
  facebook: [
    { key: 'enabled', label: 'Enable Facebook autopost', type: 'toggle', fullWidth: true },
    { key: 'pageAccessToken', label: 'Page access token', type: 'password', help: 'Page Access Token with pages_manage_posts scope. Generate from Graph API Explorer → select "Page Token".', fullWidth: true },
    { key: 'pageId', label: 'Page id', type: 'text' },
    { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://graph.facebook.com' },
    { key: 'apiVersion', label: 'API version', type: 'text', placeholder: 'v25.0' },
    { key: 'metaAppId', label: 'Meta App ID', type: 'text', help: 'Used by the Connect with Meta OAuth flow.', fullWidth: true },
    { key: 'metaAppSecret', label: 'Meta App Secret', type: 'password', help: 'Used by the Connect with Meta OAuth flow.', fullWidth: true },
  ],
}

const providerFields = computed(() => providerFieldMap[dialogPlatform.value])
const providerDialogStorageLabel = computed(() => providerDialogStorage.value === 'kv' ? 'Cloudflare KV' : 'runtime defaults')

const openProviderConfig = async (platform: Platform) => {
  providerDialogConfigured.value = false
  providerDialogStorage.value = 'runtime'
  resetProviderForm()
  isLoading.value = true

  try {
    const response = await $fetch<ProviderConfigResponse>(`/api/admin/social-queue/provider-config/${platform}`)
    if (response.success) {
      providerDialogStorage.value = response.data.storage
      providerDialogConfigured.value = response.data.configured
      applyProviderForm(response.data.config)
    }
  } catch (error) {
    console.error('Failed to load provider config:', error)
    toast({ title: 'Error', description: 'Failed to load provider configuration.', toast: 'soft-error' })
  } finally {
    isLoading.value = false
  }
}

const saveProviderConfig = async () => {
  isSaving.value = true
  try {
    const response = await $fetch<{ success: boolean }>(`/api/admin/social-queue/provider-config/${dialogPlatform.value}`, {
      method: 'PUT',
      body: buildProviderPayload(dialogPlatform.value)
    })

    if (response.success) {
      providerDialogStorage.value = 'kv'
      providerDialogConfigured.value = isCurrentProviderConfigured(dialogPlatform.value)
      toast({ title: 'Saved', description: `${activeProviderLabel.value} configuration saved to Cloudflare KV.`, toast: 'soft-success' })
      emit('saved')
      dialogOpen.value = false
    }
  } catch (error) {
    console.error('Failed to save provider config:', error)
    toast({ title: 'Error', description: 'Failed to save provider configuration.', toast: 'soft-error' })
  } finally {
    isSaving.value = false
  }
}

const startOAuthFlow = (platform: Platform) => {
  const endpoints: Record<string, string> = {
    facebook: '/api/admin/social-queue/auth/meta/init',
    instagram: '/api/admin/social-queue/auth/meta/init',
    threads: '/api/admin/social-queue/auth/threads/init',
  }
  const url = endpoints[platform]
  if (url) {
    window.location.href = url
  }
}

const testConnection = async () => {
  isTestingConnection.value = true
  testConnectionStatus.value = 'idle'
  testConnectionHandle.value = ''
  testConnectionError.value = ''

  try {
    const response = await $fetch<{ success: boolean; handle?: string; error?: string }>('/api/admin/social-queue/test-connection', {
      method: 'POST',
      body: buildProviderPayload(dialogPlatform.value)
    })

    if (response.success) {
      testConnectionStatus.value = 'success'
      testConnectionHandle.value = response.handle || ''
    } else {
      testConnectionStatus.value = 'error'
      testConnectionError.value = response.error || 'Connection failed'
    }
  } catch (error: any) {
    testConnectionStatus.value = 'error'
    testConnectionError.value = error?.data?.error || error?.message || 'Connection failed'
  } finally {
    isTestingConnection.value = false
  }
}

const refreshToken = async () => {
  isRefreshingToken.value = true
  refreshTokenStatus.value = 'idle'
  refreshTokenError.value = ''

  const buildRefreshPayload = () => {
    if (dialogPlatform.value === 'threads') {
      return {
        platform: 'threads',
        accessToken: providerForm.accessToken,
        apiVersion: providerForm.apiVersion,
      }
    }

    const appId = dialogPlatform.value === 'facebook' ? providerForm.metaAppId : providerForm.metaAppId
    const appSecret = dialogPlatform.value === 'facebook' ? providerForm.metaAppSecret : providerForm.metaAppSecret
    const accessToken = dialogPlatform.value === 'facebook' ? providerForm.pageAccessToken : providerForm.accessToken

    return {
      platform: 'meta',
      accessToken,
      appId,
      appSecret,
      apiVersion: providerForm.apiVersion,
    }
  }

  try {
    const response = await $fetch<{ success: boolean; accessToken?: string; error?: string }>('/api/admin/social-queue/refresh-token', {
      method: 'POST',
      body: buildRefreshPayload()
    })

    if (response.success && response.accessToken) {
      if (dialogPlatform.value === 'threads' || dialogPlatform.value === 'instagram') {
        providerForm.accessToken = response.accessToken
      } else if (dialogPlatform.value === 'facebook') {
        providerForm.pageAccessToken = response.accessToken
      }
      refreshTokenStatus.value = 'success'
    } else {
      refreshTokenStatus.value = 'error'
      refreshTokenError.value = response.error || 'Token refresh failed'
    }
  } catch (error: any) {
    refreshTokenStatus.value = 'error'
    refreshTokenError.value = error?.data?.error || error?.message || 'Connection failed'
  } finally {
    isRefreshingToken.value = false
  }
}

const updateProviderField = (key: keyof ProviderFormState, value: string | number) => {
  if (typeof providerForm[key] === 'number') {
    providerForm[key] = (Number.isFinite(value) ? Number(value) : 0) as never
    return
  }

  providerForm[key] = String(value) as never
}

const updateProviderBooleanField = (key: keyof ProviderFormState, value: boolean) => {
  providerForm[key] = value as never
}

const formatProviderFieldValue = (key: keyof ProviderFormState) => {
  const value = providerForm[key]
  return typeof value === 'number' ? String(value) : String(value || '')
}

const resetProviderForm = () => {
  Object.assign(providerForm, getEmptyProviderForm())
}

const applyProviderForm = (config: Partial<ProviderFormState>) => {
  resetProviderForm()
  for (const [key, value] of Object.entries(config)) {
    if (!(key in providerForm)) continue
    ;(providerForm as Record<string, unknown>)[key] = value as unknown
  }
}

const buildProviderPayload = (platform: Platform) => {
  if (platform === 'x') {
    return {
      enabled: providerForm.enabled,
      requireMedia: providerForm.requireMedia,
      oauth2AccessToken: providerForm.oauth2AccessToken,
      oauth1ConsumerKey: providerForm.oauth1ConsumerKey,
      oauth1ConsumerSecret: providerForm.oauth1ConsumerSecret,
      oauth1AccessToken: providerForm.oauth1AccessToken,
      oauth1AccessTokenSecret: providerForm.oauth1AccessTokenSecret,
    }
  }

  if (platform === 'bluesky') {
    return {
      enabled: providerForm.enabled,
      service: providerForm.service,
      identifier: providerForm.identifier,
      password: providerForm.password,
      hashtags: providerForm.hashtags,
    }
  }

  if (platform === 'instagram') {
    return {
      enabled: providerForm.enabled,
      accessToken: providerForm.accessToken,
      userId: providerForm.userId,
      baseUrl: providerForm.baseUrl,
      apiVersion: providerForm.apiVersion,
      pollIntervalMs: providerForm.pollIntervalMs,
      pollTimeoutMs: providerForm.pollTimeoutMs,
      metaAppId: providerForm.metaAppId,
      metaAppSecret: providerForm.metaAppSecret,
    }
  }

  if (platform === 'threads') {
    return {
      enabled: providerForm.enabled,
      accessToken: providerForm.accessToken,
      userId: providerForm.userId,
      baseUrl: providerForm.baseUrl,
      apiVersion: providerForm.apiVersion,
      pollIntervalMs: providerForm.pollIntervalMs,
      pollTimeoutMs: providerForm.pollTimeoutMs,
      appId: providerForm.appId,
      appSecret: providerForm.appSecret,
    }
  }

  return {
    enabled: providerForm.enabled,
    pageAccessToken: providerForm.pageAccessToken,
    pageId: providerForm.pageId,
    baseUrl: providerForm.baseUrl,
    apiVersion: providerForm.apiVersion,
    metaAppId: providerForm.metaAppId,
    metaAppSecret: providerForm.metaAppSecret,
  }
}

const isCurrentProviderConfigured = (platform: Platform) => {
  if (platform === 'x') {
    return Boolean(
      providerForm.oauth2AccessToken
      || (providerForm.oauth1ConsumerKey && providerForm.oauth1ConsumerSecret && providerForm.oauth1AccessToken && providerForm.oauth1AccessTokenSecret)
    )
  }
  if (platform === 'bluesky') {
    return Boolean(providerForm.identifier && providerForm.password)
  }
  if (platform === 'facebook') {
    return Boolean(providerForm.pageAccessToken && providerForm.pageId)
  }
  return Boolean(providerForm.accessToken && providerForm.userId)
}

function getEmptyProviderForm(): ProviderFormState {
  return {
    enabled: false,
    requireMedia: false,
    service: 'https://bsky.social',
    identifier: '',
    password: '',
    hashtags: '',
    oauth2AccessToken: '',
    oauth1ConsumerKey: '',
    oauth1ConsumerSecret: '',
    oauth1AccessToken: '',
    oauth1AccessTokenSecret: '',
    accessToken: '',
    userId: '',
    baseUrl: 'https://graph.facebook.com',
    apiVersion: 'v24.0',
    pollIntervalMs: 5000,
    pollTimeoutMs: 300000,
    pageAccessToken: '',
    pageId: '',
    metaAppId: '',
    metaAppSecret: '',
    appId: '',
    appSecret: '',
  }
}

watch(() => props.open, async (open) => {
  if (!open) return
  dialogPlatform.value = props.defaultPlatform
  testConnectionStatus.value = 'idle'
  testConnectionHandle.value = ''
  testConnectionError.value = ''
  refreshTokenStatus.value = 'idle'
  refreshTokenError.value = ''
  await openProviderConfig(props.defaultPlatform)
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isSaving.value) {
    saveProviderConfig()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>
