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

        <!-- Images Management -->
        <div v-else>
          <AdminTable
            title="Image Management"
            description="Manage all images and illustrations in the system"
            :columns="imageColumns"
            :data="images"
            :loading="isLoading"
            :pagination="pagination"
            :bulk-actions="bulkActions"
            empty-message="No images found."
            @search="handleSearch"
            @refresh="fetchImages"
            @page-change="handlePageChange"
            @bulk-action="handleBulkAction"
            @edit="editImage"
            @delete="showDeleteDialog"
            @row-click="viewImage"
          >
            <!-- Custom cell renderers -->
            <template #pathname-cell="{ cell, row }">
              <div class="flex items-center gap-3">
                <img 
                  :src="`/api/images/id/${row.id}/thumbnail`" 
                  :alt="row.name"
                  class="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  @error="handleImageError"
                />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ row.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ cell.value }}</p>
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
                  @click="viewImage(row)"
                  btn="soft-blue"
                  size="xs"
                  title="View image"
                >
                  <span class="i-ph-eye"></span>
                </UButton>
                <UButton
                  @click="editImage(row)"
                  btn="soft-gray"
                  size="xs"
                  title="Edit image"
                >
                  <span class="i-ph-pencil"></span>
                </UButton>
                <UButton
                  @click="showDeleteDialog(row)"
                  btn="soft-red"
                  size="xs"
                  title="Delete image"
                >
                  <span class="i-ph-trash"></span>
                </UButton>
              </div>
            </template>
          </AdminTable>
        </div>
      </main>
    </div>

    <!-- View Image Dialog -->
    <UDialog v-model:open="isViewDialogOpen" title="Image Details">
      <div v-if="selectedImage" class="p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Image Preview -->
          <div>
            <img 
              :src="`/api/images/id/${selectedImage.id}/medium`" 
              :alt="selectedImage.name"
              class="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
              @error="handleImageError"
            />
          </div>
          
          <!-- Image Info -->
          <div class="space-y-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ selectedImage.name }}</h3>
              <p class="text-gray-600 dark:text-gray-400">{{ selectedImage.description || 'No description' }}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Dimensions:</span>
                <p class="font-medium">{{ selectedImage.w }} × {{ selectedImage.h }}px</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Slug:</span>
                <p class="font-medium">{{ selectedImage.slug }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Views:</span>
                <p class="font-medium">{{ selectedImage.stats_views.toLocaleString() }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Downloads:</span>
                <p class="font-medium">{{ selectedImage.stats_downloads.toLocaleString() }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Likes:</span>
                <p class="font-medium">{{ selectedImage.stats_likes.toLocaleString() }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Created:</span>
                <p class="font-medium">{{ new Date(selectedImage.created_at).toLocaleDateString() }}</p>
              </div>
            </div>
            
            <div class="flex gap-3 pt-4">
              <UButton 
                :to="`/illustrations/${selectedImage.slug}`" 
                target="_blank"
                btn="soft-blue"
              >
                <span class="i-ph-arrow-square-out mr-2"></span>
                View Public Page
              </UButton>
              <UButton @click="editImage(selectedImage)" btn="soft-gray">
                <span class="i-ph-pencil mr-2"></span>
                Edit
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UDialog>

    <!-- Delete Confirmation Dialog -->
    <UDialog v-model:open="isDeleteDialogOpen" title="Delete Image">
      <div class="p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <span class="i-ph-warning text-red-600 dark:text-red-400 text-xl"></span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Delete Image</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <strong>{{ selectedImage?.name }}</strong>? This action cannot be undone.
            </p>
          </div>
        </div>
        
        <div class="flex justify-end gap-3">
          <UButton @click="isDeleteDialogOpen = false" btn="soft-gray">Cancel</UButton>
          <UButton @click="deleteImage" :loading="isDeleting" btn="soft-red">Delete Image</UButton>
        </div>
      </div>
    </UDialog>
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~/types/image'
import type { Pagination } from '~/types/pagination'
import type { AdminTableColumn, AdminBulkAction } from '~/types/admin'

const { loggedIn, user } = useUserSession()
const { toast } = useToast()

definePageMeta({
  middleware: 'authenticated'
})

// State
const images = ref<(Image & { user_name: string; user_email: string })[]>([])
const selectedImage = ref<Image | null>(null)
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
  userId: undefined as string | undefined
})

// Configuration
const imageColumns: AdminTableColumn[] = [
  { accessorKey: 'pathname', header: 'Image', sortable: false },
  { accessorKey: 'user_name', header: 'Owner', sortable: true },
  { accessorKey: 'stats_views', header: 'Views', sortable: true },
  { accessorKey: 'stats_downloads', header: 'Downloads', sortable: true },
  { accessorKey: 'stats_likes', header: 'Likes', sortable: true },
  { accessorKey: 'created_at', header: 'Created', sortable: true }
]

const bulkActions: AdminBulkAction[] = [
  {
    id: 'delete_selected',
    label: 'Delete Selected',
    icon: 'i-ph-trash',
    variant: 'soft-red',
    confirmMessage: 'Are you sure you want to delete the selected images? This action cannot be undone.'
  }
]

// Methods
const fetchImages = async () => {
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

    if (filters.value.userId) {
      query.append('userId', filters.value.userId)
    }

    const response = await $fetch(`/api/admin/images?${query.toString()}`)
    
    if (response.success) {
      images.value = response.data.images
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('Error fetching images:', error)
    toast({
      title: 'Error',
      description: 'Failed to fetch images. Please try again.',
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
  fetchImages()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchImages()
}

const handleBulkAction = async (actionId: string, selectedRows: Image[]) => {
  // Implementation for bulk actions would go here
  console.log('Bulk action:', actionId, selectedRows)
}

const viewImage = (image: Image) => {
  selectedImage.value = image
  isViewDialogOpen.value = true
}

const editImage = (image: Image) => {
  // Navigate to edit page or open edit modal
  navigateTo(`/illustrations/${image.slug}`)
}

const showDeleteDialog = (image: Image) => {
  selectedImage.value = image
  isDeleteDialogOpen.value = true
}

const deleteImage = async () => {
  if (!selectedImage.value) return

  isDeleting.value = true
  try {
    const response = await $fetch(`/api/admin/images/${selectedImage.value.id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      // Remove from local state
      images.value = images.value.filter(img => img.id !== selectedImage.value!.id)

      isDeleteDialogOpen.value = false
      pagination.value.total--

      toast({
        title: 'Success',
        description: 'Image deleted successfully',
        toast: 'soft-success',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    toast({
      title: 'Error',
      description: 'Failed to delete image. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isDeleting.value = false
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/loading.jpg' // Fallback image
}

// Lifecycle
onMounted(() => {
  if (loggedIn.value && user.value?.role === 'admin') {
    fetchImages()
  }
})

watch([loggedIn, () => user.value?.role], ([newLoggedIn, newRole]) => {
  if (newLoggedIn && newRole === 'admin') {
    fetchImages()
  }
})
</script>
