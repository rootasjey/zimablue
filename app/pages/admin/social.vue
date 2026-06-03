<template>
  <div class="space-y-5">
    <section class="space-y-6">
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
        <div class="overflow-hidden border-none p-5 sm:p-6">
          <h1 class="font-body text-3xl sm:text-3xl font-600 tracking-[0.19em] text-stone-800 dark:text-zinc-500">
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
              <NButton
                size="xs"
                btn="ghost-gray"
                :_button="{ class: 'hidden sm:inline-flex h-8 rounded-lg px-3 text-xs font-medium' }"
                @click="isProviderDialogOpen = true"
              >
                <span class="i-ph-gear text-sm"></span>
                Configure
              </NButton>
              <span class="hidden sm:inline">•</span>
              <span class="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="providerStatusPillClass">
                <span :class="providerStatusDotClass"></span>
                {{ selectedProviderStatusLabel }}
              </span>
              <span v-if="isRunningNow" class="hidden sm:inline-flex items-center gap-1.5 text-stone-400 dark:text-zinc-500">
                <span class="i-ph-spinner-gap animate-spin text-sm"></span>
                Posting...
              </span>
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
      :keyboard-nav="true"
      :draggable-rows="true"
      :is-row-draggable="(row: QueueRow) => row.status === 'queued'"
      empty-message="No queued or historical rows yet on this platform."
      @search="handleSearch"
      @refresh="fetchQueue"
      @page-change="handlePageChange"
      @bulk-action="handleBulkAction"
      @reorder="handleTableReorder"
      @duplicate="handleDuplicate"
    >
      <template #header-tabs>
        <div class="flex rounded-lg border border-stone-200 p-0.5 dark:border-zinc-700">
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            :class="activeView === 'queue' ? 'bg-indigo-500 text-white shadow-xs' : 'text-stone-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'"
            @click="activeView = 'queue'"
          >
            Queue
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            :class="activeView === 'history' ? 'bg-indigo-500 text-white shadow-xs' : 'text-stone-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'"
            @click="activeView = 'history'"
          >
            History
          </button>
        </div>
      </template>

      <template #status-header>
        <div class="flex items-center gap-2">
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
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-stone-100 text-stone-400 transition-transform hover:scale-110 dark:bg-zinc-800 dark:text-zinc-500"
            @click.stop="openPreview(row)"
          >
            <NuxtImg v-if="row.imagePathname" :src="row.imagePathname" provider="hubblob" :alt="row.imageName" class="h-full w-full object-cover" />
            <span v-else class="i-ph-image text-lg"></span>
          </button>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ row.imageName }}</p>
            <button
              type="button"
              class="truncate text-xs text-stone-400 decoration-dashed underline-offset-2 transition-colors hover:underline hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400"
              title="Copy illustration link"
              @click.stop="copySlug(row)"
            >/{{ row.imageSlug }}</button>
          </div>
        </div>
      </template>

      <template #status-cell="{ row }">
        <div class="space-y-1">
          <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" :class="[statusClass(row.status), row.status === 'failed' ? 'cursor-pointer' : '']" @click="handleErrorClick(row)">
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
        <span class="text-sm" :class="row.scheduledFor ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-zinc-400'">{{ formatDateTime(row.scheduledFor || row.publishedAt) }}</span>
      </template>

      <template #publishedAt-cell="{ row }">
        <span class="text-sm text-stone-500 dark:text-zinc-400">{{ formatDateTime(row.publishedAt) }}</span>
      </template>

      <template #userName-cell="{ row }">
        <span class="text-sm text-stone-500 dark:text-zinc-400">{{ row.userName || '—' }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center gap-1">
          <button
            v-if="row.publishedPostUrl"
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-indigo-600 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-indigo-400"
            title="Open external link"
            @click.stop="openExternalLink(row.publishedPostUrl!)"
          >
            <span class="i-ph-arrow-square-out text-sm"></span>
          </button>
          <ClientOnly>
            <NDropdownMenu
              :items="rowActionItems(row)"
              size="xs"
              :_dropdown-menu-content="{
                class: 'w-48',
                align: 'end',
                side: 'bottom',
              }"
            >
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
              >
                <span class="i-ph-dots-three-vertical text-sm"></span>
              </button>
            </NDropdownMenu>
            <template #fallback>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 dark:text-zinc-500"
              >
                <span class="i-ph-dots-three-vertical text-sm"></span>
              </button>
            </template>
          </ClientOnly>
        </div>
      </template>
    </AdminTable>

    <AdminSocialProviderDialog
      v-model:open="isProviderDialogOpen"
      :default-platform="selectedPlatform"
      :platform-options="platformOptions"
      @saved="fetchProviders"
    />

    <AdminSocialQueueDialog
      v-model:open="isAddDialogOpen"
      :default-platform="selectedPlatform"
      :platform-options="platformOptions"
      @submitted="handleQueueSubmitted"
    />

    <ImagePreviewDialog
      v-model:is-open="isPreviewOpen"
      :src="previewSrc"
      :title="previewTitle"
      :description="previewDescription"
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
interface ProviderCard {
  platform: Platform
  label: string
  enabled: boolean
  configured: boolean
  detail: string
  storage: 'kv' | 'runtime'
}

interface QueueRow {
  id: number
  imageId: number
  imageName: string
  imageDescription: string | null
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

type QueueView = 'queue' | 'history'

const { toast } = useToast()

function toastWithCopy(title: string, description: string, toastType: string) {
  toast({
    title,
    description,
    toast: toastType,
    closable: true,
    actions: [{
      label: 'Copy',
      altText: 'Copy error message',
      onClick: () => navigator.clipboard.writeText(description),
    }],
  })
}

const platformOptions: Array<{ value: Platform, label: string, icon: string }> = [
  { value: 'bluesky', label: 'Bluesky', icon: 'i-ph-butterfly' },
  { value: 'x', label: 'X', icon: 'i-ph-twitter-logo' },
  { value: 'instagram', label: 'Instagram', icon: 'i-ph-instagram-logo' },
  { value: 'threads', label: 'Threads', icon: 'i-ph-threads-logo' },
  { value: 'facebook', label: 'Facebook', icon: 'i-ph-facebook-logo' },
]

const tableColumns = [
  { accessorKey: 'imageName', header: 'Illustration' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'position', header: 'Order', hideOnMobile: true },
  { accessorKey: 'userName', header: 'Author', hideOnMobile: true },
  { accessorKey: 'scheduledFor', header: 'Scheduled' },
  { accessorKey: 'publishedAt', header: 'Last attempt', hideOnMobile: true },
]

const bulkActions: AdminBulkAction[] = [
  { id: 'retry_selected', label: 'Retry Selected', icon: 'i-ph-arrow-counter-clockwise', variant: 'soft-blue' },
  { id: 'delete_selected', label: 'Delete Selected', icon: 'i-ph-trash', variant: 'soft-red' },
]

const selectedPlatform = ref<Platform>('bluesky')
const searchQuery = ref('')
const rows = ref<QueueRow[]>([])
const providerCards = ref<ProviderCard[]>([])
const isLoading = ref(false)
const isRunningNow = ref(false)
const isRetrying = ref(false)
const isClearing = ref(false)
const isAddDialogOpen = ref(false)
const isProviderDialogOpen = ref(false)
const isPreviewOpen = ref(false)
const previewSrc = ref<string | null>(null)
const previewTitle = ref<string | null>(null)
const previewDescription = ref<string | null>(null)
const lastRunLabel = ref('Not run yet')
const pagination = ref<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false })
const queueStats = ref({ queued: 0, processing: 0, posted: 0, failed: 0 })
const activeView = ref<QueueView>('queue')
const pageByView = ref<Record<QueueView, number>>({ queue: 1, history: 1 })
const statusFilter = computed(() => activeView.value === 'queue' ? 'queued,processing,failed' : 'posted')

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
const providerStatusPillClass = computed(() => {
  if (!selectedProviderCard.value) return 'bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400'
  if (selectedProviderCard.value.configured) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
  if (selectedProviderCard.value.enabled) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
  return 'bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400'
})
const providerStatusDotClass = computed(() => {
  if (!selectedProviderCard.value) return 'h-1.5 w-1.5 rounded-full bg-stone-400'
  if (selectedProviderCard.value.configured) return 'h-1.5 w-1.5 rounded-full bg-emerald-500'
  if (selectedProviderCard.value.enabled) return 'h-1.5 w-1.5 rounded-full bg-indigo-500'
  return 'h-1.5 w-1.5 rounded-full bg-stone-400'
})
const selectedProviderStorageLabel = computed(() => {
  if (!selectedProviderCard.value) return 'Runtime fallback'
  return selectedProviderCard.value.storage === 'kv' ? 'Cloudflare KV' : 'Runtime fallback'
})
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
const rowActionItems = (row: QueueRow) => {
  const items: Array<Record<string, any>> = [
    {
      label: 'Move up',
      leading: 'i-ph-arrow-up',
      disabled: row.status !== 'queued' || !canMoveRow(row, -1),
      onClick: () => moveRow(row, -1),
    },
    {
      label: 'Move down',
      leading: 'i-ph-arrow-down',
      disabled: row.status !== 'queued' || !canMoveRow(row, 1),
      onClick: () => moveRow(row, 1),
    },
  ]

  const conditionalItems: Array<Record<string, any>> = []

  if (row.status === 'failed') {
    conditionalItems.push({
      label: 'Retry',
      leading: 'i-ph-arrow-counter-clockwise',
      onClick: () => retryFailed([row.id]),
    })
  }

  if (row.publishedPostUrl) {
    conditionalItems.push({
      label: 'Open post',
      leading: 'i-ph-arrow-square-out',
      onClick: () => window.open(row.publishedPostUrl!, '_blank'),
    })
  }

  if (conditionalItems.length > 0) {
    items.push({})
    items.push(...conditionalItems)
  }

  items.push({})
  items.push({
    label: 'Delete',
    leading: 'i-ph-trash-simple',
    onClick: () => deleteQueueRow(row),
  })

  return items
}

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
    if (statusFilter.value) {
      statusFilter.value.split(',').forEach(s => query.append('status', s.trim()))
    }
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

const openAddDialog = () => {
  isAddDialogOpen.value = true
}

const openExternalLink = (url: string) => {
  window.open(url, '_blank')
}

const openPreview = (row: QueueRow) => {
  if (!row.imagePathname) return
  previewSrc.value = row.imagePathname
  previewTitle.value = row.imageName
  previewDescription.value = row.imageDescription
  isPreviewOpen.value = true
}

const handleErrorClick = (row: QueueRow) => {
  if (row.status === 'failed' && row.lastError) {
    copyError(row.lastError)
  }
}

const copyError = async (error: string) => {
  try {
    await navigator.clipboard.writeText(error)
    toast({ title: 'Error copied', description: error, toast: 'soft-success' })
  } catch {
    toast({ title: 'Copy failed', description: 'Could not copy to clipboard.', toast: 'soft-error' })
  }
}

const copySlug = async (row: QueueRow) => {
  const url = `${window.location.origin}/illustrations/${row.imageSlug}`
  try {
    await navigator.clipboard.writeText(url)
    toast({ title: 'Link copied', description: url, toast: 'soft-success' })
  } catch {
    toast({ title: 'Copy failed', description: 'Could not copy to clipboard.', toast: 'soft-error' })
  }
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
        toastWithCopy('Run finished', data.reason || 'Execution completed with a failure.', 'soft-warning')
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
    const queuedItems = rows.value.filter(r => r.status === 'queued')
    const nonQueuedItems = rows.value.filter(r => r.status !== 'queued')
    const reorderedQueued = nextIds.map(id => queuedItems.find(r => r.id === id)).filter(Boolean) as QueueRow[]
    rows.value = [...reorderedQueued, ...nonQueuedItems]
  } catch (error) {
    console.error('Failed to reorder queue:', error)
    toast({ title: 'Error', description: 'Failed to reorder the social queue.', toast: 'soft-error' })
  }
}

const handleTableReorder = async (dragIndex: number, dropIndex: number) => {
  const fullItems = [...rows.value]
  const [moved] = fullItems.splice(dragIndex, 1)
  if (!moved) return
  fullItems.splice(dropIndex, 0, moved)

  const orderedIds = fullItems
    .filter(item => item.status === 'queued')
    .map(item => item.id)

  if (orderedIds.length < 2) return

  try {
    await $fetch('/api/admin/social-queue/reorder', {
      method: 'POST',
      body: {
        platform: selectedPlatform.value,
        queueIds: orderedIds,
      }
    })
    rows.value = fullItems
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
  if (provider.enabled) return 'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300'
  return 'border-stone-200 bg-stone-50 text-stone-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500'
}

const providerPillClass = (provider: ProviderCard) => {
  if (provider.configured && provider.enabled) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
  if (provider.enabled) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
  return 'bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400'
}

const statusClass = (status: QueueStatus) => {
  if (status === 'posted') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  if (status === 'failed') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
  if (status === 'processing') return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
  return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
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

watch(activeView, (view, oldView) => {
  if (oldView) {
    pageByView.value[oldView] = pagination.value.page
  }
  pagination.value.page = pageByView.value[view]
  fetchQueue()
})

watch(selectedPlatform, (val) => {
  pageByView.value = { queue: 1, history: 1 }
  pagination.value.page = 1
  fetchQueue()
  if (import.meta.client) {
    try { localStorage.setItem('zima:socialPlatform', val) } catch { /* ignore */ }
  }
})

const handleDuplicate = () => {
  toast({ title: 'Coming Soon', description: 'Duplicate queue item is not yet implemented.', toast: 'soft-info', duration: 3000 })
}

onMounted(async () => {
  let needsQueueFetch = true

  if (import.meta.client) {
    try {
      const saved = localStorage.getItem('zima:socialPlatform')
      if (saved && platformOptions.some(p => p.value === saved) && saved !== selectedPlatform.value) {
        selectedPlatform.value = saved as Platform
        needsQueueFetch = false // watch(selectedPlatform) already calls fetchQueue
      }
    } catch { /* localStorage unavailable */ }
  }

  await Promise.all([needsQueueFetch ? fetchQueue() : Promise.resolve(), fetchProviders()])

  const route = useRoute()
  const connected = route.query.connected as string | undefined
  const errorMsg = route.query.error as string | undefined
  const partial = route.query.partial as string | undefined

  if (errorMsg) {
    toastWithCopy('Connection failed', errorMsg, 'soft-error')
    await navigateTo('/admin/social', { replace: true })
  } else if (connected) {
    const platforms = connected.split('+')
    const label = platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' + ')
    if (partial === 'instagram') {
      toast({ title: `${label} connected`, description: 'Facebook configured, but no Instagram Business Account was found.', toast: 'soft-warning' })
    } else {
      toast({ title: `${label} connected`, description: 'Provider credentials saved to Cloudflare KV.', toast: 'soft-success' })
    }
    await navigateTo('/admin/social', { replace: true })
  }
})
</script>
