<template>
  <div class="space-y-6">
    <section class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
      <div class="admin-card overflow-hidden border-none bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,245,244,0.94))] p-5 shadow-sm dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.98),rgba(17,24,39,0.94))] sm:p-6">
        <p class="text-xs font-medium uppercase tracking-[0.22em] text-stone-400 dark:text-zinc-500">Collections</p>
        <h2 class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Series visibility and editorial structure</h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-stone-500 dark:text-zinc-400">
          Keep public series clean, watch how many images are grouped together, and adjust visibility without dropping into a heavier editor flow.
        </p>

        <div class="mt-5 flex flex-wrap gap-2">
          <span class="admin-badge admin-badge-stone">{{ pagination.total }} total collections</span>
          <span class="admin-badge admin-badge-cyan">{{ collections.length }} on this page</span>
          <span class="admin-badge admin-badge-amber">{{ publicCollections }} public here</span>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        <div class="admin-card p-4">
          <p class="text-[11px] uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Public ratio</p>
          <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ publicRatio }}%</p>
          <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">Share of visible collections exposed to visitors.</p>
        </div>
        <div class="admin-card p-4">
          <p class="text-[11px] uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Grouped images</p>
          <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ visibleGroupedImages.toLocaleString() }}</p>
          <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">Images currently represented on this page.</p>
        </div>
        <div class="admin-card p-4">
          <p class="text-[11px] uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Page reach</p>
          <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ visibleCollectionViews.toLocaleString() }}</p>
          <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">Combined collection views across the visible rows.</p>
        </div>
      </div>
    </section>

    <AdminTable
      title="Collections"
      description="Manage all collections in the system"
      :columns="unaColumns"
      :data="collections"
      :loading="isLoading"
      :pagination="pagination"
      :bulk-actions="bulkActions"
      empty-message="No collections found."
      @search="handleSearch"
      @refresh="fetchCollections"
      @page-change="handlePageChange"
      @bulk-action="handleBulkAction"
      @row-click="viewCollection"
      @edit="editCollection"
      @delete="showDeleteDialog"
    >
      <!-- Name + description -->
      <template #name-cell="{ row }">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <span class="i-ph-folder text-amber-600 dark:text-amber-400"></span>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-48">{{ row.name }}</p>
            <p class="text-xs text-stone-400 dark:text-zinc-500 truncate max-w-48">{{ row.description || 'No description' }}</p>
          </div>
        </div>
      </template>

      <!-- Owner -->
      <template #user_name-cell="{ row }">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
            {{ (row.user_name || '?')[0]?.toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-32">{{ row.user_name || '—' }}</p>
          </div>
        </div>
      </template>

      <!-- Visibility badge -->
      <template #is_public-cell="{ row }">
        <span :class="[
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          row.is_public
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400'
        ]">
          <span :class="row.is_public ? 'i-ph-globe' : 'i-ph-lock'" class="text-xs"></span>
          {{ row.is_public ? 'Public' : 'Private' }}
        </span>
      </template>

      <!-- Image count -->
      <template #image_count-cell="{ row }">
        <div class="flex items-center gap-1.5 text-stone-500 dark:text-zinc-400">
          <span class="i-ph-images text-sm"></span>
          <span class="text-sm tabular-nums">{{ row.image_count }}</span>
        </div>
      </template>

      <!-- Views -->
      <template #stats_views-cell="{ row }">
        <div class="flex items-center gap-1.5 text-stone-500 dark:text-zinc-400">
          <span class="i-ph-eye text-sm"></span>
          <span class="text-sm tabular-nums">{{ (row.stats_views ?? 0).toLocaleString() }}</span>
        </div>
      </template>

      <!-- Created date -->
      <template #created_at-cell="{ row }">
        <ClientOnly>
          <span class="text-sm text-stone-500 dark:text-zinc-400">
            {{ row.created_at ? new Date(typeof row.created_at === 'number' ? row.created_at * 1000 : row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' }}
          </span>
        </ClientOnly>
      </template>
    </AdminTable>

    <!-- View Collection Dialog -->
    <NDialog v-model:open="isViewDialogOpen" :_dialog="{ class: 'max-w-lg' }">
      <template #content>
        <div v-if="selectedCollection" class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">{{ selectedCollection.name }}</h2>
              <p class="text-sm text-stone-400 dark:text-zinc-500 mt-0.5">{{ selectedCollection.description || 'No description' }}</p>
            </div>
            <button @click="isViewDialogOpen = false" class="text-stone-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
              <span class="i-ph-x text-lg"></span>
            </button>
          </div>

          <!-- Stats grid -->
          <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="rounded-xl bg-stone-50 dark:bg-zinc-800 p-3">
              <p class="text-xs text-stone-400 dark:text-zinc-500 mb-0.5">Images</p>
              <p class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{{ selectedCollection.image_count }}</p>
            </div>
            <div class="rounded-xl bg-stone-50 dark:bg-zinc-800 p-3">
              <p class="text-xs text-stone-400 dark:text-zinc-500 mb-0.5">Views</p>
              <p class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{{ (selectedCollection.stats_views ?? 0).toLocaleString() }}</p>
            </div>
          </div>

          <div class="space-y-2 mb-5">
            <div class="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-zinc-800">
              <span class="text-xs text-stone-400 dark:text-zinc-500">Visibility</span>
              <span :class="selectedCollection.is_public ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-zinc-400'" class="text-sm font-medium">
                {{ selectedCollection.is_public ? 'Public' : 'Private' }}
              </span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-zinc-800">
              <span class="text-xs text-stone-400 dark:text-zinc-500">Slug</span>
              <span class="text-sm font-classic text-zinc-700 dark:text-zinc-300">{{ selectedCollection.slug }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-xs text-stone-400 dark:text-zinc-500">Owner</span>
              <span class="text-sm text-zinc-700 dark:text-zinc-300">{{ selectedCollection.user_name }}</span>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
              @click="isViewDialogOpen = false"
            >Close</button>
            <NuxtLink
              :to="`/collections/${selectedCollection.slug}`"
              target="_blank"
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <span class="i-ph-arrow-square-out text-sm"></span>
              View
            </NuxtLink>
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              @click="editCollection(selectedCollection)"
            >Edit</button>
          </div>
        </div>
      </template>
    </NDialog>

    <!-- Delete Confirmation Dialog -->
    <NDialog v-model:open="isDeleteDialogOpen">
      <template #content>
        <div class="p-6">
          <div class="flex items-start gap-4 mb-6">
            <div class="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
              <span class="i-ph-warning text-rose-600 dark:text-rose-400 text-xl"></span>
            </div>
            <div>
              <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Delete Collection</h3>
              <p class="text-sm text-stone-500 dark:text-zinc-400">
                Are you sure you want to delete <strong class="text-zinc-700 dark:text-zinc-300">{{ selectedCollection?.name }}</strong>? This action cannot be undone.
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
              @click="isDeleteDialogOpen = false"
            >Cancel</button>
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-60"
              :disabled="isDeleting"
              @click="deleteCollection"
            >
              <span v-if="isDeleting" class="i-ph-spinner-gap animate-spin mr-1.5 inline-block"></span>
              Delete
            </button>
          </div>
        </div>
      </template>
    </NDialog>
  </div>
</template>

<script lang="ts" setup>
// Using a lightweight row type to match admin API shape
type CollectionRow = {
  id: number; name: string; description: string; slug: string; is_public: boolean;
  image_count: number; stats_views: number; stats_downloads: number; stats_likes: number;
  created_at: string; updated_at: string; user_name: string; user_email: string;
}
import type { Pagination } from '~~/shared/types/pagination'
import type { AdminBulkAction } from '~~/shared/types/admin'

const { toast } = useToast()

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

// State
const collections = ref<CollectionRow[]>([])
const selectedCollection = ref<CollectionRow | null>(null)
const isViewDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isLoading = ref(false)
const isDeleting = ref(false)

const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
})

const filters = ref({
  search: '',
  isPublic: undefined as string | undefined,
  userId: undefined as string | undefined
})

const unaColumns = [
  { accessorKey: 'name', header: 'Collection' },
  { accessorKey: 'user_name', header: 'Owner' },
  { accessorKey: 'is_public', header: 'Visibility' },
  { accessorKey: 'image_count', header: 'Images' },
  { accessorKey: 'stats_views', header: 'Views' },
  { accessorKey: 'created_at', header: 'Created' },
]

const bulkActions: AdminBulkAction[] = [
  { id: 'make_public', label: 'Make Public', icon: 'i-ph-globe', variant: 'soft-blue' },
  { id: 'make_private', label: 'Make Private', icon: 'i-ph-lock', variant: 'soft-gray' },
  { id: 'delete_selected', label: 'Delete Selected', icon: 'i-ph-trash', variant: 'soft-red' },
]

const publicCollections = computed(() => {
  return collections.value.filter((collection) => collection.is_public).length
})

const publicRatio = computed(() => {
  if (!collections.value.length) return 0
  return Math.round((publicCollections.value / collections.value.length) * 100)
})

const visibleGroupedImages = computed(() => {
  return collections.value.reduce((total, collection) => total + Number(collection.image_count ?? 0), 0)
})

const visibleCollectionViews = computed(() => {
  return collections.value.reduce((total, collection) => total + Number(collection.stats_views ?? 0), 0)
})

// Methods
const fetchCollections = async () => {
  isLoading.value = true
  try {
    const query = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    })
    if (filters.value.search) query.append('search', filters.value.search)
    if (filters.value.isPublic !== undefined) query.append('isPublic', filters.value.isPublic)
    if (filters.value.userId) query.append('userId', filters.value.userId)

    const response = await $fetch(`/api/admin/collections?${query.toString()}`)
    if (response.success) {
      collections.value = response.data.collections
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('Error fetching collections:', error)
    toast({ title: 'Error', description: 'Failed to fetch collections.', toast: 'soft-error', duration: 5000 })
  } finally {
    isLoading.value = false
  }
}

const handleSearch = (searchTerm: string) => {
  filters.value.search = searchTerm
  pagination.value.page = 1
  fetchCollections()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchCollections()
}

const handleBulkAction = async (actionId: string, selectedRows: any[]) => {
  const rows = selectedRows as CollectionRow[]
  if (rows.length === 0) return

  if (actionId === 'make_public') {
    let success = 0
    for (const r of rows) {
      try {
        await $fetch(`/api/collections/${r.slug}`, { method: 'PUT', body: { is_public: true } })
        success += 1
        const idx = collections.value.findIndex(c => c.id === r.id)
        if (idx !== -1 && collections.value[idx]) collections.value[idx].is_public = true
      } catch {}
    }
    toast({ title: 'Updated', description: `Made ${success} collection(s) public.`, toast: 'soft-success' })
    return
  }

  if (actionId === 'make_private') {
    let success = 0
    for (const r of rows) {
      try {
        await $fetch(`/api/collections/${r.slug}`, { method: 'PUT', body: { is_public: false } })
        success += 1
        const idx = collections.value.findIndex(c => c.id === r.id)
        if (idx !== -1 && collections.value[idx]) collections.value[idx].is_public = false
      } catch {}
    }
    toast({ title: 'Updated', description: `Made ${success} collection(s) private.`, toast: 'soft-success' })
    return
  }

  if (actionId === 'delete_selected') {
    const confirmed = window.confirm(`Delete ${rows.length} selected collection${rows.length > 1 ? 's' : ''}? This cannot be undone.`)
    if (!confirmed) return
    let success = 0
    for (const r of rows) {
      try {
        const resp: any = await $fetch(`/api/admin/collections/${r.id}`, { method: 'DELETE' })
        if (resp?.success) {
          success += 1
          collections.value = collections.value.filter(col => col.id !== r.id)
        }
      } catch {}
    }
    if (success > 0) {
      pagination.value.total = Math.max(0, pagination.value.total - success)
      toast({ title: 'Deleted', description: `Deleted ${success} collection(s).`, toast: 'soft-success' })
    } else {
      toast({ title: 'Failed', description: 'No collections deleted.', toast: 'soft-error' })
    }
  }
}

const viewCollection = (collection: CollectionRow) => {
  selectedCollection.value = collection
  isViewDialogOpen.value = true
}

const editCollection = (collection: CollectionRow) => {
  navigateTo(`/collections/${collection.slug}`)
}

const showDeleteDialog = (collection: CollectionRow) => {
  selectedCollection.value = collection
  isDeleteDialogOpen.value = true
}

const deleteCollection = async () => {
  if (!selectedCollection.value) return
  isDeleting.value = true
  try {
    const response = await $fetch(`/api/admin/collections/${selectedCollection.value.id}`, { method: 'DELETE' })
    if (response.success) {
      collections.value = collections.value.filter(col => col.id !== selectedCollection.value!.id)
      isDeleteDialogOpen.value = false
      pagination.value.total--
      toast({ title: 'Deleted', description: 'Collection deleted successfully', toast: 'soft-success', duration: 3000 })
    }
  } catch (error) {
    console.error('Error deleting collection:', error)
    toast({ title: 'Error', description: 'Failed to delete collection.', toast: 'soft-error', duration: 5000 })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => fetchCollections())
</script>
