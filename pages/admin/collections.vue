<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="flex">
      <!-- Sidebar -->
      <AdminSidebar />
      
      <!-- Main Content -->
      <main class="flex-1 p-8">
        <!-- Access Control -->
        <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
          <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Access Denied</h2>
          <p class="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
          <UButton to="/user" class="mt-4">Go to Profile</UButton>
        </div>

        <!-- Collections Management -->
        <div v-else>
          <AdminTable
            title="Collection Management"
            description="Manage all collections in the system"
            :columns="collectionColumns"
            :data="collections"
            :loading="isLoading"
            :pagination="pagination"
            :bulk-actions="bulkActions"
            empty-message="No collections found."
            @search="handleSearch"
            @refresh="fetchCollections"
            @page-change="handlePageChange"
            @bulk-action="handleBulkAction"
            @edit="editCollection"
            @delete="showDeleteDialog"
            @row-click="viewCollection"
          >
            <!-- Custom cell renderers -->
            <template #name-cell="{ cell, row }">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <span class="i-ph-folder text-gray-400"></span>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ cell.value }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ row.description || 'No description' }}</p>
                </div>
              </div>
            </template>

            <template #user_name-cell="{ cell, row }">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span class="i-ph-user text-xs text-gray-600 dark:text-gray-400"></span>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ cell.value }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ row.user_email }}</p>
                </div>
              </div>
            </template>

            <template #is_public-cell="{ cell }">
              <span 
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  cell.value 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                ]"
              >
                {{ cell.value ? 'Public' : 'Private' }}
              </span>
            </template>

            <template #image_count-cell="{ cell }">
              <div class="flex items-center gap-1">
                <span class="i-ph-image text-gray-400"></span>
                <span class="text-sm">{{ cell.value }} images</span>
              </div>
            </template>

            <template #stats_views-cell="{ cell }">
              <div class="flex items-center gap-1">
                <span class="i-ph-eye text-gray-400"></span>
                <span class="text-sm">{{ cell.value.toLocaleString() }}</span>
              </div>
            </template>

            <template #stats_downloads-cell="{ cell }">
              <div class="flex items-center gap-1">
                <span class="i-ph-download text-gray-400"></span>
                <span class="text-sm">{{ cell.value.toLocaleString() }}</span>
              </div>
            </template>

            <template #stats_likes-cell="{ cell }">
              <div class="flex items-center gap-1">
                <span class="i-ph-heart text-gray-400"></span>
                <span class="text-sm">{{ cell.value.toLocaleString() }}</span>
              </div>
            </template>

            <template #created_at-cell="{ cell }">
              {{ new Date(cell.value).toLocaleDateString() }}
            </template>

            <template #actions="{ row }">
              <div class="flex items-center gap-2">
                <UButton
                  @click="viewCollection(row)"
                  btn="soft-blue"
                  size="xs"
                  title="View collection"
                >
                  <span class="i-ph-eye"></span>
                </UButton>
                <UButton
                  @click="editCollection(row)"
                  btn="soft-gray"
                  size="xs"
                  title="Edit collection"
                >
                  <span class="i-ph-pencil"></span>
                </UButton>
                <UButton
                  @click="showDeleteDialog(row)"
                  btn="soft-red"
                  size="xs"
                  title="Delete collection"
                >
                  <span class="i-ph-trash"></span>
                </UButton>
              </div>
            </template>
          </AdminTable>
        </div>
      </main>
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
</template>

<script lang="ts" setup>
import type { Collection } from '~/types/collection'
import type { Pagination } from '~/types/pagination'
import type { AdminTableColumn, AdminBulkAction } from '~/types/admin'

const { loggedIn, user } = useUserSession()
const { toast } = useToast()

definePageMeta({
  middleware: 'authenticated'
})

// State
const collections = ref<(Collection & { user_name: string; user_email: string })[]>([])
const selectedCollection = ref<Collection | null>(null)
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

// Configuration
const collectionColumns: AdminTableColumn[] = [
  { accessorKey: 'name', header: 'Collection', sortable: true },
  { accessorKey: 'user_name', header: 'Owner', sortable: true },
  { accessorKey: 'is_public', header: 'Visibility', sortable: true },
  { accessorKey: 'image_count', header: 'Images', sortable: true },
  { accessorKey: 'stats_views', header: 'Views', sortable: true },
  { accessorKey: 'stats_likes', header: 'Likes', sortable: true },
  { accessorKey: 'created_at', header: 'Created', sortable: true }
]

const bulkActions: AdminBulkAction[] = [
  {
    id: 'make_public',
    label: 'Make Public',
    icon: 'i-ph-globe',
    variant: 'soft-green',
    confirmMessage: 'Are you sure you want to make the selected collections public?'
  },
  {
    id: 'make_private',
    label: 'Make Private',
    icon: 'i-ph-lock',
    variant: 'soft-gray',
    confirmMessage: 'Are you sure you want to make the selected collections private?'
  },
  {
    id: 'delete_selected',
    label: 'Delete Selected',
    icon: 'i-ph-trash',
    variant: 'soft-red',
    confirmMessage: 'Are you sure you want to delete the selected collections? This action cannot be undone.'
  }
]

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

const handleSearch = (searchTerm: string) => {
  filters.value.search = searchTerm
  pagination.value.page = 1
  fetchCollections()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchCollections()
}

const handleBulkAction = async (actionId: string, selectedRows: Collection[]) => {
  // Implementation for bulk actions would go here
  console.log('Bulk action:', actionId, selectedRows)
}

const viewCollection = (collection: Collection) => {
  selectedCollection.value = collection
  isViewDialogOpen.value = true
}

const editCollection = (collection: Collection) => {
  // Navigate to edit page
  navigateTo(`/collections/${collection.slug}`)
}

const showDeleteDialog = (collection: Collection) => {
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
</script>
