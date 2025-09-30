<template>
  <div>
    <!-- Access Control -->
    <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
      <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Access Denied</h2>
      <p class="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
      <UButton to="/user" class="mt-4">Go to Profile</UButton>
    </div>

    <!-- Collections Management -->
    <div v-else>
      <!-- Header -->
      <div class="p-6 bg-white dark:bg-black rounded-t-lg border border-b-0 border-gray-200 dark:border-gray-700">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Collection Management</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage all collections in the system</p>
          </div>

          <div class="flex items-center gap-3">
            <UInput
              v-model="filters.search"
              placeholder="Search..."
              @keyup.enter="handleSearch(filters.search)"
              @input="debouncedSearch"
              class="w-64"
            >
              <template #leading>
                <span class="i-ph-magnifying-glass"></span>
              </template>
            </UInput>

            <UButton @click="fetchCollections" :loading="isLoading" btn="soft-gray" size="sm">
              <span class="i-ph-arrow-clockwise mr-2"></span>
              Refresh
            </UButton>
          </div>
        </div>

        <!-- Bulk Actions -->
        <div v-if="selectedCollections.length > 0" class="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedCollections.length }} selected
          </span>
          <UButton btn="soft-green" size="sm" @click="bulkMakePublic">
            <span class="i-ph-globe mr-2"></span>
            Make Public
          </UButton>
          <UButton btn="soft-gray" size="sm" @click="bulkMakePrivate">
            <span class="i-ph-lock mr-2"></span>
            Make Private
          </UButton>
          <UButton btn="soft-red" size="sm" @click="deleteSelected">
            <span class="i-ph-trash mr-2"></span>
            Delete Selected
          </UButton>
        </div>
      </div>

      <!-- Table -->
      <div class="border-x border-gray-200 dark:border-gray-700">
        <UTable
          :columns="unaColumns"
          :data="collections"
          :loading="isLoading"
          row-id="id"
          :enable-row-selection="true"
          :enable-multi-row-selection="true"
          v-model:rowSelection="rowSelection"
          @row="onRowClick"
          empty-text="No collections found."
        >
          <template #row_actions-cell="{ cell }">
            <UDropdownMenu
              :items="collectionRowMenuItems(cell.row.original)"
              size="xs"
              dropdown-menu="link-pink"
              :_dropdown-menu-content="{ class: 'w-44', align: 'start', side: 'bottom' }"
              :_dropdown-menu-trigger="{ icon: true, square: true, label: 'i-lucide-ellipsis-vertical' }"
            />
          </template>

          <template #name-cell="{ cell }">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <span class="i-ph-folder text-gray-400"></span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ cell.getValue() }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ cell.row.original.description || 'No description' }}</p>
              </div>
            </div>
          </template>

          <template #user_name-cell="{ cell }">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span class="i-ph-user text-xs text-gray-600 dark:text-gray-400"></span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ cell.getValue() }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ cell.row.original.user_email }}</p>
              </div>
            </div>
          </template>

          <template #is_public-cell="{ cell }">
            <span :class="['px-2 py-1 text-xs font-medium rounded-full', cell.getValue() ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400']">
              {{ cell.getValue() ? 'Public' : 'Private' }}
            </span>
          </template>

          <template #image_count-cell="{ cell }">
            <div class="flex items-center gap-1">
              <span class="i-ph-image text-gray-400"></span>
              <span class="text-sm">{{ cell.getValue() }} images</span>
            </div>
          </template>

          <template #stats_views-cell="{ cell }">
            <div class="flex items-center gap-1">
              <span class="i-ph-eye text-gray-400"></span>
              <span class="text-sm">{{ Number(cell.getValue()).toLocaleString() }}</span>
            </div>
          </template>

          <template #stats_downloads-cell="{ cell }">
            <div class="flex items-center gap-1">
              <span class="i-ph-download text-gray-400"></span>
              <span class="text-sm">{{ Number(cell.getValue()).toLocaleString() }}</span>
            </div>
          </template>

          <template #stats_likes-cell="{ cell }">
            <div class="flex items-center gap-1">
              <span class="i-ph-heart text-gray-400"></span>
              <span class="text-sm">{{ Number(cell.getValue()).toLocaleString() }}</span>
            </div>
          </template>

          <template #created_at-cell="{ cell }">
            {{ new Date(cell.getValue() as string).toLocaleDateString() }}
          </template>
        </UTable>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="p-6 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg bg-white dark:bg-gray-800">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} to 
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of 
            {{ pagination.total }} results
          </div>

          <div class="flex items-center gap-2">
            <UButton @click="handlePageChange(pagination.page - 1)" :disabled="!pagination.hasPrev" btn="soft-gray" size="sm">
              <span class="i-ph-caret-left"></span>
            </UButton>

            <span class="text-sm text-gray-600 dark:text-gray-400 px-3">
              Page {{ pagination.page }} of {{ pagination.totalPages }}
            </span>

            <UButton @click="handlePageChange(pagination.page + 1)" :disabled="!pagination.hasNext" btn="soft-gray" size="sm">
              <span class="i-ph-caret-right"></span>
            </UButton>
          </div>
        </div>

      <!-- View Collection Dialog -->
    <UDialog v-model:open="isViewDialogOpen" title="Collection Details">
      <div v-if="selectedCollection" class="p-6">
        <div class="space-y-6">
          <!-- Collection Info -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ selectedCollection.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-1">{{ selectedCollection.description || 'No description' }}</p>
          </div>
          
          <!-- Stats Grid -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <span class="text-gray-500 dark:text-gray-400">Images:</span>
              <p class="font-medium text-lg">{{ selectedCollection.image_count }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <span class="text-gray-500 dark:text-gray-400">Views:</span>
              <p class="font-medium text-lg">{{ selectedCollection.stats_views.toLocaleString() }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <span class="text-gray-500 dark:text-gray-400">Downloads:</span>
              <p class="font-medium text-lg">{{ selectedCollection.stats_downloads.toLocaleString() }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <span class="text-gray-500 dark:text-gray-400">Likes:</span>
              <p class="font-medium text-lg">{{ selectedCollection.stats_likes.toLocaleString() }}</p>
            </div>
          </div>
          
          <!-- Additional Info -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Visibility:</span>
              <p class="font-medium">{{ selectedCollection.is_public ? 'Public' : 'Private' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Slug:</span>
              <p class="font-medium">{{ selectedCollection.slug }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Owner:</span>
              <p class="font-medium">{{ selectedCollection.user_name }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Created:</span>
              <p class="font-medium">{{ new Date(selectedCollection.created_at).toLocaleDateString() }}</p>
            </div>
          </div>
          
          <div class="flex gap-3 pt-4">
            <UButton 
              :to="`/collections/${selectedCollection.slug}`" 
              target="_blank"
              btn="soft-blue"
            >
              <span class="i-ph-arrow-square-out mr-2"></span>
              View Public Page
            </UButton>
            <UButton @click="editCollection(selectedCollection)" btn="soft-gray">
              <span class="i-ph-pencil mr-2"></span>
              Edit
            </UButton>
          </div>
        </div>
      </div>
    </UDialog>

    <!-- Delete Confirmation Dialog -->
    <UDialog v-model:open="isDeleteDialogOpen" title="Delete Collection">
      <div class="p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <span class="i-ph-warning text-red-600 dark:text-red-400 text-xl"></span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Delete Collection</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <strong>{{ selectedCollection?.name }}</strong>? This action cannot be undone.
            </p>
          </div>
        </div>
        
        <div class="flex justify-end gap-3">
          <UButton @click="isDeleteDialogOpen = false" btn="soft-gray">Cancel</UButton>
          <UButton @click="deleteCollection" :loading="isDeleting" btn="soft-red">Delete Collection</UButton>
        </div>
      </div>
    </UDialog>
    </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Using a lightweight row type to match admin API shape
type CollectionRow = {
  id: number; name: string; description: string; slug: string; is_public: boolean;
  image_count: number; stats_views: number; stats_downloads: number; stats_likes: number;
  created_at: string; updated_at: string; user_name: string; user_email: string;
}
import type { Pagination } from '~/types/pagination'
import type { RowSelectionState } from '@tanstack/vue-table'

const { loggedIn, user } = useUserSession()
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
const rowSelection = ref<RowSelectionState>({})

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

// Table columns (UTable)
const unaColumns = [
  { id: 'row_actions', header: '', enableSorting: false },
  { accessorKey: 'name', header: 'Collection', enableSorting: true },
  { accessorKey: 'user_name', header: 'Owner', enableSorting: true },
  { accessorKey: 'is_public', header: 'Visibility', enableSorting: true },
  { accessorKey: 'image_count', header: 'Images', enableSorting: true },
  { accessorKey: 'stats_views', header: 'Views', enableSorting: true },
  { accessorKey: 'stats_likes', header: 'Likes', enableSorting: true },
  { accessorKey: 'created_at', header: 'Created', enableSorting: true }
]

const selectedCollections = computed(() => {
  const selected = new Set(
    Object.entries(rowSelection.value)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
  )
  return collections.value.filter(c => selected.has(String(c.id)))
})

// Methods
const fetchCollections = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return
  
  isLoading.value = true
  try {
    const query = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    })

    if (filters.value.search) {
      query.append('search', filters.value.search)
    }

    if (filters.value.isPublic !== undefined) {
      query.append('isPublic', filters.value.isPublic)
    }

    if (filters.value.userId) {
      query.append('userId', filters.value.userId)
    }

    const response = await $fetch(`/api/admin/collections?${query.toString()}`)
    
    if (response.success) {
      collections.value = response.data.collections
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('Error fetching collections:', error)
    toast({
      title: 'Error',
      description: 'Failed to fetch collections. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isLoading.value = false
  }
}

let searchTimeout: any
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 400)
}

const handleSearch = (searchTerm?: string) => {
  filters.value.search = searchTerm ?? ''
  pagination.value.page = 1
  fetchCollections()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchCollections()
}

const bulkMakePublic = async () => {
  const rows = selectedCollections.value
  if (rows.length === 0) return
  let success = 0
  for (const r of rows) {
    try {
      await $fetch(`/api/collections/${r.slug}`, { method: 'PUT', body: { is_public: true } })
      success += 1
      // update local
      const idx = collections.value.findIndex(c => c.id === r.id)
      if (idx !== -1) collections.value[idx].is_public = true
    } catch {}
  }
  toast({ title: 'Updated', description: `Made ${success} collection(s) public.`, toast: 'soft-success' })
}

const bulkMakePrivate = async () => {
  const rows = selectedCollections.value
  if (rows.length === 0) return
  let success = 0
  for (const r of rows) {
    try {
      await $fetch(`/api/collections/${r.slug}`, { method: 'PUT', body: { is_public: false } })
      success += 1
      const idx = collections.value.findIndex(c => c.id === r.id)
      if (idx !== -1) collections.value[idx].is_public = false
    } catch {}
  }
  toast({ title: 'Updated', description: `Made ${success} collection(s) private.`, toast: 'soft-success' })
}

const deleteSelected = async () => {
  const rows = selectedCollections.value
  if (rows.length === 0) return
  const confirmed = window.confirm(`Delete ${rows.length} selected collection${rows.length > 1 ? 's' : ''}? This cannot be undone.`)
  if (!confirmed) return
  let success = 0
  for (const r of rows) {
    try {
      const resp: any = await $fetch(`/api/admin/collections/${r.id}`, { method: 'DELETE' })
      if (resp?.success) {
        success += 1
        collections.value = collections.value.filter(col => col.id !== r.id)
        delete (rowSelection.value as any)[String(r.id)]
      }
    } catch (e) {
      // continue
    }
  }
  if (success > 0) {
    pagination.value.total = Math.max(0, pagination.value.total - success)
    toast({ title: 'Deleted', description: `Deleted ${success} collection(s).`, toast: 'soft-success' })
  } else {
    toast({ title: 'Failed', description: 'No collections deleted.', toast: 'soft-error' })
  }
}

const viewCollection = (collection: CollectionRow) => {
  selectedCollection.value = collection
  isViewDialogOpen.value = true
}

const editCollection = (collection: CollectionRow) => {
  // Navigate to edit page
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
    const response = await $fetch(`/api/admin/collections/${selectedCollection.value.id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      // Remove from local state
      collections.value = collections.value.filter(col => col.id !== selectedCollection.value!.id)

      isDeleteDialogOpen.value = false
      pagination.value.total--

      toast({
        title: 'Success',
        description: 'Collection deleted successfully',
        toast: 'soft-success',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('Error deleting collection:', error)
    toast({
      title: 'Error',
      description: 'Failed to delete collection. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isDeleting.value = false
  }
}

// Lifecycle
onMounted(() => {
  if (loggedIn.value && user.value?.role === 'admin') {
    fetchCollections()
  }
})

watch([loggedIn, () => user.value?.role], ([newLoggedIn, newRole]) => {
  if (newLoggedIn && newRole === 'admin') {
    fetchCollections()
  }
})

// Row click
const onRowClick = (event: Event, row: CollectionRow) => {
  const target = event.target as HTMLElement
  if (target.closest('button') || target.closest('a') || target.closest('input')) return
  viewCollection(row)
}

// Row dropdown items
const collectionRowMenuItems = (row: CollectionRow) => [
  { label: 'View', onClick: () => viewCollection(row) },
  { label: 'Edit', onClick: () => editCollection(row) },
  { label: 'Delete', onClick: () => showDeleteDialog(row) },
]
</script>
