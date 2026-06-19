<template>
  <div class="space-y-6">
    <AdminTable
      title="Collections"
      description="Manage all collections in the system"
      :columns="unaColumns"
      :data="collections"
      :loading="isLoading"
      :pagination="pagination"
      :bulk-actions="bulkActions"
      :keyboard-nav="true"
      empty-message="No collections found."
      @search="handleSearch"
      @refresh="fetchCollections"
      @page-change="handlePageChange"
      @bulk-action="handleBulkAction"
      @row-click="viewCollection"
      @edit="editCollection"
      @delete="showDeleteDialog"
      @duplicate="handleDuplicate"
    >
      <!-- Name + description -->
      <template #name-cell="{ row }">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <span class="i-ph-folder text-indigo-600 dark:text-indigo-400"></span>
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
    <NDialog v-model:open="isViewDialogOpen" :_dialog="{ class: 'w-[calc(100vw-1rem)] sm:max-w-lg' }">
      <template #content>
        <div v-if="selectedCollection" class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">{{ selectedCollection.name }}</h2>
              <p class="text-sm text-stone-400 dark:text-zinc-500 mt-0.5">{{ selectedCollection.description || 'No description' }}</p>
            </div>
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
            <NuxtLink
              :to="`/collections/${selectedCollection.slug}`"
              target="_blank"
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <span class="i-ph-arrow-square-out text-sm"></span>
              View
            </NuxtLink>
            <button
              class="px-10 h-9 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
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
const { showErrorToast } = useErrorToast()

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
  { accessorKey: 'stats_views', header: 'Views', hideOnMobile: true },
  { accessorKey: 'created_at', header: 'Created', hideOnMobile: true },
]

const bulkActions: AdminBulkAction[] = [
  { id: 'make_public', label: 'Make Public', icon: 'i-ph-globe', variant: 'soft-blue' },
  { id: 'make_private', label: 'Make Private', icon: 'i-ph-lock', variant: 'soft-gray' },
  { id: 'delete_selected', label: 'Delete Selected', icon: 'i-ph-trash', variant: 'soft-red' },
]

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
    showErrorToast(error, 'Error', 'Failed to fetch collections.')
  } finally {
    isLoading.value = false
  }
  openCollectionFromRoute()
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
    }
  } catch (error) {
    console.error('Error deleting collection:', error)
    showErrorToast(error, 'Error', 'Failed to delete collection.')
  } finally {
    isDeleting.value = false
  }
}

const handleDuplicate = () => {
  toast({ title: 'Coming Soon', description: 'Duplicate collection is not yet implemented.', toast: 'soft-info', duration: 3000 })
}

// --- URL-driven dialog ---
const route = useRoute()
const router = useRouter()

const openCollectionFromRoute = () => {
  const id = route.query.collectionId
  if (!id || !collections.value.length) return
  const found = collections.value.find(col => col.id === Number(id))
  if (found) viewCollection(found)
}

watch(() => route.query.collectionId, () => openCollectionFromRoute())

watch(isViewDialogOpen, (open) => {
  if (!open && route.query.collectionId) {
    const q = { ...route.query }
    delete q.collectionId
    router.replace({ query: q })
  }
})

onMounted(() => fetchCollections())
</script>
