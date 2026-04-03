<template>
  <div class="space-y-5">
    <section class="space-y-6">
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
        <div class="overflow-hidden border-none p-5 sm:p-6">
          <h1 class="font-classic text-3xl sm:text-3xl font-600 text-stone-800 dark:text-zinc-500">
            {{ currentPlatformLabel }}
          </h1>

          <div class="mt-3 flex flex-wrap gap-1.5">
            <NTooltip v-for="option in platformOptions" :key="option.value" :content="`${option.label} ${selectedProviderStatusLabel}`" placement="top">
              <button
                :key="option.value"
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-colors"
                :class="selectedPlatform === option.value
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300'
                  : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-zinc-600'"
                :aria-pressed="selectedPlatform === option.value"
                :aria-label="option.label"
                @click="selectPlatform(option.value)"
              >
                <span :class="option.icon"></span>
              </button>
            </NTooltip>

            <div class="ml-2 flex items-center gap-1.5 text-xs text-stone-500 dark:text-zinc-400">
              <span>•</span>
              <ClientOnly>
                <NDropdownMenu
                  :items="platformMenuItems"
                  size="xs"
                  dropdown-menu="ghost-gray"
                  :_dropdown-menu-trigger="{
                    icon: true,
                    square: true,
                    rounded: 'full',
                    label: 'i-ph-gear',
                  }"
                >
                </NDropdownMenu>
                <template #fallback>
                  <button
                    type="button"
                    class="inline-flex h-8 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  >
                    <span>Configure</span>
                  </button>
                </template>
              </ClientOnly>
            </div>
          </div>

        </div>
      </div>
    </section>

    <AdminTable
      :columns="tableColumns"
      :data="rows"
      :loading="isLoading"
      :pagination="pagination"
      :bulk-actions="bulkActions"
      empty-message="No queued or historical rows yet on this platform."
      @search="handleSearch"
      @refresh="fetchQueue"
      @page-change="handlePageChange"
      @bulk-action="handleBulkAction"
    >
      <template #status-header>
        <div class="flex items-center justify-between gap-2">
          <NTooltip disable-closing-trigger :_tooltip-content="{ class: 'max-w-56 bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-700' }">
            <template #default>
              <NButton
                rounded="full"
                btn="~"
                size="xs"
                aria-label="View queue stats"
              >
                <span class="i-ph-info text-xs"></span>
              </NButton>
            </template>

            <template #content>
              <div class="space-y-2 p-1">
                <p class="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-400 dark:text-zinc-500">Queue stats</p>
                <div class="grid gap-1.5">
                  <span class="admin-badge admin-badge-stone">{{ queueStats.queued }} queued</span>
                  <span class="admin-badge admin-badge-cyan">{{ queueStats.processing }} processing</span>
                  <span class="admin-badge admin-badge-cyan">{{ queueStats.posted }} posted</span>
                  <span class="admin-badge admin-badge-rose">{{ queueStats.failed }} failed</span>
                </div>
              </div>
            </template>
          </NTooltip>

          <span class="admin-section-title">Status</span>
          <NSelect
            v-model="selectedStatusOption"
            :items="statusFilterOptions"
            item-key="label"
            value-key="label"
            size="xs"
            class="w-36"
          />
        </div>
      </template>

      <template #actions-header>
        <ClientOnly>
          <NDropdownMenu
            :items="queueActionItems"
            size="xs"
            dropdown-menu="ghost-gray"
            :_dropdown-menu-content="{ class: 'w-52', align: 'end', side: 'bottom' }"
          >
            <template #default>
              <button
                type="button"
                class="inline-flex h-8 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <span>Actions</span>
                <span class="i-ph-caret-down text-[0.7rem]"></span>
              </button>
            </template>
          </NDropdownMenu>
          <template #fallback>
            <button
              type="button"
              class="inline-flex h-8 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <span>Actions</span>
              <span class="i-ph-caret-down text-[0.7rem]"></span>
            </button>
          </template>
        </ClientOnly>
      </template>

      <template #imageName-cell="{ row }">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-stone-100 text-stone-400 dark:bg-zinc-800 dark:text-zinc-500">
            <NuxtImg v-if="row.imagePathname" :src="row.imagePathname" provider="hubblob" :alt="row.imageName" class="h-full w-full object-cover" />
            <span v-else class="i-ph-image text-lg"></span>
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ row.imageName }}</p>
            <p class="truncate text-xs text-stone-400 dark:text-zinc-500">/{{ row.imageSlug }}</p>
          </div>
        </div>
      </template>

      <template #status-cell="{ row }">
        <div class="space-y-1">
          <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" :class="statusClass(row.status)">
            <span :class="statusIcon(row.status)"></span>
            {{ row.status }}
          </span>
          <p v-if="row.lastError" class="max-w-56 truncate text-[11px] text-rose-600 dark:text-rose-300">{{ row.lastError }}</p>
        </div>
      </template>

      <template #position-cell="{ row }">
        <span class="text-sm tabular-nums text-stone-500 dark:text-zinc-400">{{ row.position }}</span>
      </template>

      <template #scheduledFor-cell="{ row }">
        <span class="text-sm text-stone-500 dark:text-zinc-400">{{ formatDateTime(row.scheduledFor) }}</span>
      </template>

      <template #publishedAt-cell="{ row }">
        <span class="text-sm text-stone-500 dark:text-zinc-400">{{ formatDateTime(row.publishedAt) }}</span>
      </template>

      <template #userName-cell="{ row }">
        <span class="text-sm text-stone-500 dark:text-zinc-400">{{ row.userName || '—' }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 disabled:opacity-30 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-200" :disabled="row.status !== 'queued' || !canMoveRow(row, -1)" title="Move up" @click.stop="moveRow(row, -1)">
            <span class="i-ph-arrow-up text-sm"></span>
          </button>
          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 disabled:opacity-30 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-200" :disabled="row.status !== 'queued' || !canMoveRow(row, 1)" title="Move down" @click.stop="moveRow(row, 1)">
            <span class="i-ph-arrow-down text-sm"></span>
          </button>
          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-30 dark:text-zinc-500 dark:hover:bg-cyan-900/20 dark:hover:text-cyan-300" :disabled="row.status !== 'failed'" title="Retry" @click.stop="retryFailed([row.id])">
            <span class="i-ph-arrow-counter-clockwise text-sm"></span>
          </button>
          <a v-if="row.publishedPostUrl" :href="row.publishedPostUrl" target="_blank" class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-200" title="Open published post" @click.stop>
            <span class="i-ph-arrow-square-out text-sm"></span>
          </a>
          <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-900/20 dark:hover:text-rose-400" title="Delete" @click.stop="deleteQueueRow(row)">
            <span class="i-ph-trash-simple text-sm"></span>
          </button>
        </div>
      </template>
    </AdminTable>

    <NDialog v-model:open="isProviderDialogOpen" :_dialog="{ class: 'max-w-2xl' }">
      <template #content>
          <div class="space-y-4 p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-zinc-500">Provider config</p>
              <h3 class="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{{ activeProviderLabel }}</h3>
                <p class="mt-1 text-sm text-stone-500 dark:text-zinc-400">Saved to {{ providerDialogStorageLabel }}. Runtime values stay as the fallback.</p>
            </div>
            <button type="button" class="text-stone-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200" @click="isProviderDialogOpen = false">
              <span class="i-ph-x text-lg"></span>
            </button>
          </div>

          <div v-if="isProviderDialogLoading" class="flex items-center gap-2 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">
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

          <div class="flex justify-end gap-2">
            <button class="h-10 rounded-xl bg-stone-100 px-4 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700" @click="isProviderDialogOpen = false">Cancel</button>
            <button class="h-10 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60" :disabled="isProviderDialogSaving" @click="saveProviderConfig">
              <span v-if="isProviderDialogSaving" class="mr-1.5 inline-block animate-spin i-ph-spinner-gap"></span>
              Save configuration
            </button>
          </div>
        </div>
      </template>
    </NDialog>

    <AdminSocialQueueDialog
      v-model:open="isAddDialogOpen"
      :default-platform="selectedPlatform"
      :platform-options="platformOptions"
      @submitted="handleQueueSubmitted"
    />
  </div>
</template>

<script lang="ts" setup>
import type { AdminBulkAction } from '~~/shared/types/admin'
import type { Pagination } from '~~/shared/types/pagination'

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

type QueueStatus = 'queued' | 'processing' | 'posted' | 'failed'
type Platform = 'x' | 'bluesky' | 'instagram' | 'threads' | 'facebook'
type ProviderStorage = 'kv' | 'runtime'

interface ProviderCard {
  platform: Platform
  label: string
  enabled: boolean
  configured: boolean
  detail: string
  storage: ProviderStorage
}

interface QueueRow {
  id: number
  imageId: number
  imageName: string
  imageSlug: string
  imagePathname: string | null
  userName: string | null
  status: QueueStatus
  position: number
  scheduledFor: string | null
  publishedAt: string | null
  publishedPostUrl: string | null
  lastError: string | null
}

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
}

interface SelectOption<T> {
  label: string
  value: T
}

const { toast } = useToast()

const platformOptions: Array<{ value: Platform, label: string, icon: string }> = [
  { value: 'bluesky', label: 'Bluesky', icon: 'i-ph-butterfly' },
  { value: 'x', label: 'X', icon: 'i-ph-twitter-logo' },
  { value: 'instagram', label: 'Instagram', icon: 'i-ph-instagram-logo' },
  { value: 'threads', label: 'Threads', icon: 'i-ph-threads-logo' },
  { value: 'facebook', label: 'Facebook', icon: 'i-ph-facebook-logo' },
]

const statusFilterOptions: Array<SelectOption<string>> = [
  { label: 'All statuses', value: '' },
  { label: 'Queued', value: 'queued' },
  { label: 'Processing', value: 'processing' },
  { label: 'Posted', value: 'posted' },
  { label: 'Failed', value: 'failed' },
]

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
  ],
  threads: [
    { key: 'enabled', label: 'Enable Threads autopost', type: 'toggle', fullWidth: true },
    { key: 'accessToken', label: 'Access token', type: 'password', fullWidth: true },
    { key: 'userId', label: 'Threads user id', type: 'text' },
    { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://graph.threads.net' },
    { key: 'apiVersion', label: 'API version', type: 'text', placeholder: 'v1.0' },
    { key: 'pollIntervalMs', label: 'Poll interval (ms)', type: 'number' },
    { key: 'pollTimeoutMs', label: 'Poll timeout (ms)', type: 'number' },
  ],
  facebook: [
    { key: 'enabled', label: 'Enable Facebook autopost', type: 'toggle', fullWidth: true },
    { key: 'pageAccessToken', label: 'Page access token', type: 'password', fullWidth: true },
    { key: 'pageId', label: 'Page id', type: 'text' },
    { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://graph.facebook.com' },
    { key: 'apiVersion', label: 'API version', type: 'text', placeholder: 'v25.0' },
  ],
}

const tableColumns = [
  { accessorKey: 'imageName', header: 'Illustration' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'position', header: 'Order' },
  { accessorKey: 'userName', header: 'Author' },
  { accessorKey: 'scheduledFor', header: 'Scheduled' },
  { accessorKey: 'publishedAt', header: 'Last attempt' },
]

const bulkActions: AdminBulkAction[] = [
  { id: 'retry_selected', label: 'Retry Selected', icon: 'i-ph-arrow-counter-clockwise', variant: 'soft-blue' },
  { id: 'delete_selected', label: 'Delete Selected', icon: 'i-ph-trash', variant: 'soft-red' },
]

const selectedPlatform = ref<Platform>('bluesky')
const statusFilter = ref('')
const searchQuery = ref('')
const rows = ref<QueueRow[]>([])
const providerCards = ref<ProviderCard[]>([])
const isLoading = ref(false)
const isRunningNow = ref(false)
const isRetrying = ref(false)
const isClearing = ref(false)
const isAddDialogOpen = ref(false)
const isProviderDialogOpen = ref(false)
const isProviderDialogLoading = ref(false)
const isProviderDialogSaving = ref(false)
const providerDialogPlatform = ref<Platform>('bluesky')
const providerDialogStorage = ref<ProviderStorage>('runtime')
const providerDialogConfigured = ref(false)
const lastRunLabel = ref('Not run yet')
const pagination = ref<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false })
const queueStats = ref({ queued: 0, processing: 0, posted: 0, failed: 0 })
const providerForm = reactive<ProviderFormState>(getEmptyProviderForm())

const currentPlatformLabel = computed(() => platformOptions.find(option => option.value === selectedPlatform.value)?.label || selectedPlatform.value)
const providerTabs = computed<ProviderCard[]>(() => platformOptions.map((option) => {
  const provider = providerCards.value.find(item => item.platform === option.value)
  return provider || {
    platform: option.value,
    label: option.label,
    enabled: false,
    configured: false,
    detail: '',
    storage: 'runtime',
  }
}))
const selectedProviderCard = computed(() => providerTabs.value.find(provider => provider.platform === selectedPlatform.value) || null)
const selectedProviderStatusLabel = computed(() => {
  if (!selectedProviderCard.value) return 'Unknown'
  if (selectedProviderCard.value.configured) return 'Configured'
  if (selectedProviderCard.value.enabled) return 'Needs setup'
  return 'Disabled'
})
const selectedProviderStorageLabel = computed(() => {
  if (!selectedProviderCard.value) return 'Runtime fallback'
  return selectedProviderCard.value.storage === 'kv' ? 'Cloudflare KV' : 'Runtime fallback'
})
const platformMenuItems = computed(() => [
  {
    label: `Configure ${currentPlatformLabel.value}`,
    onClick: () => openProviderConfig(selectedPlatform.value),
  },
])
const queueActionItems = computed(() => [
  {
    label: 'Add to queue',
    onClick: () => openAddDialog(),
  },
  {
    label: 'Run now',
    onClick: () => runNow(),
  },
  {},
  {
    label: 'Retry failed items',
    onClick: () => retryFailed(),
  },
  {
    label: 'Clear finished items',
    onClick: () => clearFinished(),
  },
])
const activeProviderLabel = computed(() => platformOptions.find(option => option.value === providerDialogPlatform.value)?.label || providerDialogPlatform.value)
const providerFields = computed(() => providerFieldMap[providerDialogPlatform.value])
const providerDialogStorageLabel = computed(() => providerDialogStorage.value === 'kv' ? 'Cloudflare KV' : 'runtime defaults')
const selectedStatusOption = computed({
  get: (): SelectOption<string> => statusFilterOptions.find(option => option.value === statusFilter.value) ?? statusFilterOptions[0] ?? { label: 'All statuses', value: '' },
  set: (option: SelectOption<string>) => {
    statusFilter.value = option?.value || ''
  }
})
const readyProviderCount = computed(() => providerTabs.value.filter(provider => provider.enabled && provider.configured).length)
const queuedRows = computed(() => rows.value.filter(row => row.status === 'queued'))

const fetchQueue = async () => {
  isLoading.value = true
  try {
    const query = new URLSearchParams({
      page: String(pagination.value.page),
      limit: String(pagination.value.limit),
      platform: selectedPlatform.value,
    })
    if (statusFilter.value) query.append('status', statusFilter.value)
    if (searchQuery.value) query.append('search', searchQuery.value)

    const response = await $fetch<{
      success: boolean
      data: QueueRow[]
      pagination: Pagination
      stats: typeof queueStats.value
    }>(`/api/admin/social-queue?${query.toString()}`)

    if (response.success) {
      rows.value = response.data
      pagination.value = response.pagination
      queueStats.value = response.stats
    }
  } catch (error) {
    console.error('Failed to fetch social queue:', error)
    toast({ title: 'Error', description: 'Failed to fetch social queue.', toast: 'soft-error' })
  } finally {
    isLoading.value = false
  }
}

const fetchProviders = async () => {
  try {
    const response = await $fetch<{ success: boolean, data: ProviderCard[] }>('/api/admin/social-queue/providers')
    if (response.success) {
      providerCards.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch provider statuses:', error)
  }
}

const openProviderConfig = async (platform: Platform) => {
  providerDialogPlatform.value = platform
  providerDialogConfigured.value = false
  providerDialogStorage.value = 'runtime'
  resetProviderForm()
  isProviderDialogOpen.value = true
  isProviderDialogLoading.value = true

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
    isProviderDialogLoading.value = false
  }
}

const saveProviderConfig = async () => {
  isProviderDialogSaving.value = true
  try {
    const response = await $fetch<{ success: boolean }>(`/api/admin/social-queue/provider-config/${providerDialogPlatform.value}`, {
      method: 'PUT',
      body: buildProviderPayload(providerDialogPlatform.value)
    })

    if (response.success) {
      providerDialogStorage.value = 'kv'
      providerDialogConfigured.value = isCurrentProviderConfigured(providerDialogPlatform.value)
      toast({ title: 'Saved', description: `${activeProviderLabel.value} configuration saved to Cloudflare KV.`, toast: 'soft-success' })
      await fetchProviders()
      isProviderDialogOpen.value = false
    }
  } catch (error) {
    console.error('Failed to save provider config:', error)
    toast({ title: 'Error', description: 'Failed to save provider configuration.', toast: 'soft-error' })
  } finally {
    isProviderDialogSaving.value = false
  }
}

const openAddDialog = () => {
  isAddDialogOpen.value = true
}

const handleQueueSubmitted = async (payload: { platform: Platform }) => {
  if (selectedPlatform.value !== payload.platform) {
    selectedPlatform.value = payload.platform
  }

  pagination.value.page = 1
  await fetchQueue()
}

const runNow = async () => {
  isRunningNow.value = true
  try {
    const response = await $fetch<{ success: boolean, data: any }>('/api/admin/social-queue/run-now', {
      method: 'POST',
      body: { platform: selectedPlatform.value }
    })

    if (response.success) {
      const data = response.data
      lastRunLabel.value = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      if ('success' in data && data.success) {
        toast({ title: 'Run complete', description: `${currentPlatformLabel.value} queue processed successfully.`, toast: 'soft-success' })
      } else if ('skipped' in data && data.skipped) {
        toast({ title: 'Run skipped', description: data.reason || 'No item was processed.', toast: 'soft-warning' })
      } else {
        toast({ title: 'Run finished', description: data.reason || 'Execution completed with a failure.', toast: 'soft-warning' })
      }
      await fetchQueue()
    }
  } catch (error) {
    console.error('Failed to run social autopost:', error)
    toast({ title: 'Error', description: 'Failed to run the social autopost task.', toast: 'soft-error' })
  } finally {
    isRunningNow.value = false
  }
}

const retryFailed = async (queueIds?: number[]) => {
  isRetrying.value = true
  try {
    const response = await $fetch<{ success: boolean, count: number }>('/api/admin/social-queue/retry-failed', {
      method: 'POST',
      body: {
        queueIds,
        platform: selectedPlatform.value,
      }
    })
    if (response.success) {
      toast({ title: 'Retry queued', description: `${response.count} failed item(s) reset to queued.`, toast: 'soft-success' })
      await fetchQueue()
    }
  } catch (error) {
    console.error('Failed to retry queue items:', error)
    toast({ title: 'Error', description: 'Failed to reset failed queue items.', toast: 'soft-error' })
  } finally {
    isRetrying.value = false
  }
}

const clearFinished = async () => {
  const confirmed = window.confirm(`Clear posted and failed rows on ${currentPlatformLabel.value}?`)
  if (!confirmed) return

  isClearing.value = true
  try {
    const response = await $fetch<{ success: boolean, count: number }>('/api/admin/social-queue/clear-finished', {
      method: 'POST',
      body: {
        platform: selectedPlatform.value,
      }
    })
    if (response.success) {
      toast({ title: 'Cleared', description: `${response.count} finished row(s) removed from the queue.`, toast: 'soft-success' })
      pagination.value.page = 1
      await fetchQueue()
    }
  } catch (error) {
    console.error('Failed to clear finished rows:', error)
    toast({ title: 'Error', description: 'Failed to clear finished rows.', toast: 'soft-error' })
  } finally {
    isClearing.value = false
  }
}

const deleteQueueRow = async (row: QueueRow) => {
  const confirmed = window.confirm(`Remove ${row.imageName} from the social queue?`)
  if (!confirmed) return

  try {
    const response = await $fetch<{ success: boolean }>(`/api/admin/social-queue/${row.id}`, { method: 'DELETE' })
    if (response.success) {
      toast({ title: 'Removed', description: 'Queue row removed.', toast: 'soft-success' })
      await fetchQueue()
    }
  } catch (error) {
    console.error('Failed to delete queue row:', error)
    toast({ title: 'Error', description: 'Failed to delete queue row.', toast: 'soft-error' })
  }
}

const handleSearch = (value: string) => {
  searchQuery.value = value
  pagination.value.page = 1
  fetchQueue()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchQueue()
}

const handleBulkAction = async (actionId: string, selectedRows: QueueRow[]) => {
  if (!selectedRows.length) return

  if (actionId === 'retry_selected') {
    await retryFailed(selectedRows.map(row => row.id))
    return
  }

  if (actionId === 'delete_selected') {
    const confirmed = window.confirm(`Remove ${selectedRows.length} selected row(s) from the queue?`)
    if (!confirmed) return
    for (const row of selectedRows) {
      await deleteQueueRow(row)
    }
  }
}

const canMoveRow = (row: QueueRow, direction: -1 | 1) => {
  const currentIndex = queuedRows.value.findIndex(item => item.id === row.id)
  if (currentIndex === -1) return false
  const nextIndex = currentIndex + direction
  return nextIndex >= 0 && nextIndex < queuedRows.value.length
}

const moveRow = async (row: QueueRow, direction: -1 | 1) => {
  const orderedIds = queuedRows.value.map(item => item.id)
  const currentIndex = orderedIds.findIndex(id => id === row.id)
  if (currentIndex === -1) return
  const nextIndex = currentIndex + direction
  if (nextIndex < 0 || nextIndex >= orderedIds.length) return

  const nextIds = [...orderedIds]
  const [moved] = nextIds.splice(currentIndex, 1)
  if (moved === undefined) {
    return
  }
  nextIds.splice(nextIndex, 0, moved)

  try {
    await $fetch('/api/admin/social-queue/reorder', {
      method: 'POST',
      body: {
        platform: selectedPlatform.value,
        queueIds: nextIds,
      }
    })
    await fetchQueue()
  } catch (error) {
    console.error('Failed to reorder queue:', error)
    toast({ title: 'Error', description: 'Failed to reorder the social queue.', toast: 'soft-error' })
  }
}

const selectPlatform = (platform: Platform) => {
  selectedPlatform.value = platform
}

const providerIcon = (platform: Platform) => platformOptions.find(option => option.value === platform)?.icon || 'i-ph-share-network'

const providerAccentClass = (provider: ProviderCard) => {
  if (provider.configured && provider.enabled) return 'bg-[linear-gradient(90deg,#14b8a6,#22c55e)] dark:bg-[linear-gradient(90deg,#14b8a6,#4ade80)]'
  if (provider.enabled) return 'bg-[linear-gradient(90deg,#f59e0b,#f97316)] dark:bg-[linear-gradient(90deg,#f59e0b,#fb7185)]'
  return 'bg-[linear-gradient(90deg,#a8a29e,#78716c)] dark:bg-[linear-gradient(90deg,#52525b,#3f3f46)]'
}

const providerIconWrapClass = (provider: ProviderCard) => {
  if (provider.configured && provider.enabled) return 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
  if (provider.enabled) return 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'
  return 'border-stone-200 bg-stone-50 text-stone-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500'
}

const providerPillClass = (provider: ProviderCard) => {
  if (provider.configured && provider.enabled) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
  if (provider.enabled) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
  return 'bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400'
}

const statusClass = (status: QueueStatus) => {
  if (status === 'posted') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  if (status === 'failed') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
  if (status === 'processing') return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
}

const statusIcon = (status: QueueStatus) => {
  if (status === 'posted') return 'i-ph-check-circle'
  if (status === 'failed') return 'i-ph-warning-circle'
  if (status === 'processing') return 'i-ph-spinner-gap animate-spin'
  return 'i-ph-timer'
}

const formatDateTime = (value: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
    }
  }

  return {
    enabled: providerForm.enabled,
    pageAccessToken: providerForm.pageAccessToken,
    pageId: providerForm.pageId,
    baseUrl: providerForm.baseUrl,
    apiVersion: providerForm.apiVersion,
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
  }
}

watch([selectedPlatform, statusFilter], () => {
  pagination.value.page = 1
  fetchQueue()
})

onMounted(async () => {
  await Promise.all([fetchProviders(), fetchQueue()])
})
</script>