<template>
  <div>
    <!-- Access Control -->
    <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
      <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Access Denied</h2>
      <p class="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
      <NButton to="/user" class="mt-4">Go to Profile</NButton>
    </div>

    <!-- Images Management -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-700 text-gray-900 dark:text-white">Image Management</h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1">Manage all images and illustrations in the system</p>
        </div>
      </div>

      <!-- Search and Actions Card -->
      <div class="rounded-[28px] p-6 bg-[#D1E0E9] dark:bg-gray-800">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <NInput
            v-model="searchQuery"
            placeholder="Search images..."
            @keyup.enter="handleSearch(searchQuery)"
            @input="debouncedSearch"
            size="sm"
            class="flex-1 b-black focus-within:border-blue-300 dark:b-gray-700"
            rounded="6"
          >
            <template #leading>
              <span class="i-ph-magnifying-glass"></span>
            </template>
          </NInput>

          <NButton
            @click="fetchImages"
            :loading="isLoading"
            btn="light:soft-blue dark:solid-gray"
            size="sm"
            rounded="6"
          >
            <span class="i-ph-arrow-clockwise mr-2"></span>
            Refresh
          </NButton>
        </div>

        <!-- Bulk Actions -->
        <div v-if="selectedImages.length > 0" class="flex items-center gap-2 mt-4 pt-4 border-t border-[#b7cbd8]">
          <span class="text-sm font-600 text-gray-700">
            {{ selectedImages.length }} selected
          </span>
          <NButton
            v-for="action in bulkActions"
            :key="action.id"
            @click="handleBulkAction(action.id)"
            :btn="action.variant || 'soft-gray'"
            size="sm"
          >
            <span v-if="action.icon" :class="[action.icon, 'mr-2']"></span>
            {{ action.label }}
          </NButton>
        </div>
      </div>

      <!-- Table Card -->
      <div class="rounded-[28px] bg-[#D1E0E9] dark:bg-gray-800 overflow-hidden">
        <div class="p-6">
          <NTable
            :columns="unaColumns"
            :data="images"
            :loading="isLoading"
            row-id="id"
            :enable-row-selection="true"
            :enable-multi-row-selection="true"
            v-model:rowSelection="rowSelection"
            @row="onRowClick"
            empty-text="No images found."
            :una="{
              tableRoot: 'rounded-[28px] b-transparent',
              tableHead: 'b-transparent',
              tableRow: 'b-transparent cursor-pointer hover:bg-[#000000]/5',
              tableLoadingRow: 'bg-[#D1DFE9] b-[#D1DFE9] dark:bg-gray-700/50',
              tableEmpty: 'bg-[#D1DFE9] b-[#D1DFE9] dark:bg-gray-700/50',
              tableCell: 'table-cell',
            }"
            >
              <!-- Left actions dropdown -->
              <template #row_actions-cell="{ cell }">
                <ClientOnly>
                  <NDropdownMenu
                    :items="imageRowMenuItems(cell.row.original)"
                    size="xs"
                    dropdown-menu="link-black"
                    :_dropdown-menu-content="{ class: 'w-44', align: 'start', side: 'bottom' }"
                    :_dropdown-menu-trigger="{
                      icon: true,
                      square: true,
                      label: 'i-lucide-ellipsis-vertical',
                    }"
                  />
                  <template #fallback>
                    <div class="w-8 h-8 grid place-items-center text-gray-500">
                      <span class="i-lucide-ellipsis-vertical"></span>
                    </div>
                  </template>
                </ClientOnly>
              </template>

              <!-- Image cell -->
              <template #pathname-cell="{ cell }">
                <div class="flex items-center gap-3">
                  <NuxtImg
                    provider="hubblob"
                    :src="getVariantSrc(cell.row.original, ['xxs', 'xs', 'sm'])"
                    :alt="cell.row.original.name"
                    class="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    @error="handleImageError"
                  />
                  <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ cell.row.original.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ cell.getValue() }}</p>
                  </div>
                </div>
              </template>

              <!-- Owner cell -->
              <template #user_name-cell="{ cell }">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <NIcon name="i-ph-user" class="text-white" size="xs" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ cell.getValue() }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ cell.row.original.user_email }}</p>
                  </div>
                </div>
              </template>

              <!-- Stats cells -->
              <template #stats_views-cell="{ cell }">
                <div class="flex items-center gap-1">
                  <NIcon name="i-ph-eye-bold" size="sm" />
                  <span class="text-sm">{{ Number(cell.getValue()).toLocaleString() }}</span>
                </div>
              </template>

              <template #stats_downloads-cell="{ cell }">
                <div class="flex items-center gap-1">
                  <NIcon name="i-ph-download-bold" size="sm" />
                  <span class="text-sm">{{ Number(cell.getValue()).toLocaleString() }}</span>
                </div>
              </template>

              <template #stats_likes-cell="{ cell }">
                <div class="flex items-center gap-1">
                  <NIcon name="i-ph-heart-bold" size="sm" />
                  <span class="text-sm">{{ Number(cell.getValue()).toLocaleString() }}</span>
                </div>
              </template>

              <template #created_at-cell="{ cell }">
                <ClientOnly>
                  {{ new Date(cell.getValue() as string).toLocaleDateString() }}
                  <template #fallback>
                    {{ (cell.getValue() as string).slice(0, 10) }}
                  </template>
                </ClientOnly>
              </template>

            </NTable>
        </div>

        <!-- Pagination -->
        <div v-if="pagination && pagination.totalPages > 1" class="px-6 pb-6">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-600">
              Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} to
              {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of
              {{ pagination.total }} results
            </div>

            <div class="flex items-center gap-2">
              <NButton
                @click="handlePageChange(pagination.page - 1)"
                :disabled="!pagination.hasPrev"
                btn="soft-gray"
                size="sm"
              >
                <span class="i-ph-caret-left"></span>
              </NButton>

              <span class="text-sm text-gray-600 px-3">
                Page {{ pagination.page }} of {{ pagination.totalPages }}
              </span>

              <NButton
                @click="handlePageChange(pagination.page + 1)"
                :disabled="!pagination.hasNext"
                btn="soft-gray"
                size="sm"
              >
                <span class="i-ph-caret-right"></span>
              </NButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Image Dialog -->
    <NDialog v-model:open="isViewDialogOpen" title="Image Details">
      <div v-if="selectedImage" class="p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Image Preview -->
          <div>
            <NuxtImg
              v-if="selectedImage"
              provider="hubblob"
              :src="getVariantSrc(selectedImage, ['md', 'sm', 'lg', 'xs', 'xxs', 'original'])"
              :alt="selectedImage.name"
              class="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
              @error="handleImageError"
            />
            
            <div class="flex flex-col gap-3 pt-4">
              <NButton 
                :to="`/illustrations/${selectedImage.slug}`" 
                target="_blank"
                btn="soft-blue"
              >
                <span class="i-ph-arrow-square-out mr-2"></span>
                View Public Page
              </NButton>
              <NButton @click="editImage(selectedImage)" btn="soft-gray">
                <span class="i-ph-pencil mr-2"></span>
                Edit
              </NButton>
            </div>
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
          </div>
        </div>
      </div>
    </NDialog>

    <!-- Delete Confirmation Dialog -->
    <NDialog v-model:open="isDeleteDialogOpen" title="Delete Image">
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
          <NButton @click="isDeleteDialogOpen = false" btn="soft-gray">Cancel</NButton>
          <NButton @click="deleteImage" :loading="isDeleting" btn="soft-red">Delete Image</NButton>
        </div>
      </div>
    </NDialog>

    <!-- Edit Image Dialog -->
    <NDialog v-model:open="isEditDialogOpen" title="Edit Image">
      <div class="p-6 space-y-4">
        <NFormGroup label="Name" name="name">
          <NInput v-model="editForm.name" placeholder="Image name" />
        </NFormGroup>

        <NFormGroup label="Slug" name="slug">
          <NInput v-model="editForm.slug" placeholder="url-friendly-slug" @input="slugTouched = true" />
          <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 pt-2">
            <NCheckbox v-model="autoSlug" />
            <span>Auto-update from name</span>
          </div>
        </NFormGroup>

        <NFormGroup label="Description" name="description">
          <NInput v-model="editForm.description" type="textarea" placeholder="Image description" />
        </NFormGroup>

        <div class="flex justify-end gap-3 pt-2">
          <NButton @click="isEditDialogOpen = false" btn="soft-gray">Cancel</NButton>
          <NButton @click="saveEditedImage" :loading="isSavingEdit" :disabled="!editForm.name || !editForm.slug" btn="soft-blue">Save Changes</NButton>
        </div>
      </div>
    </NDialog>
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~/types/image'
import type { Pagination } from '~/types/pagination'
import type { AdminBulkAction } from '~/types/admin'
import type { VariantType } from '~/types/image'
import type { RowSelectionState } from '@tanstack/vue-table'

const { loggedIn, user } = useUserSession()
const { toast } = useToast()

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

// State
const images = ref<(Image & { user_name: string; user_email: string })[]>([])
const selectedImage = ref<Image | null>(null)
const isViewDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isLoading = ref(false)
const isDeleting = ref(false)
const isEditDialogOpen = ref(false)
const isSavingEdit = ref(false)
const searchQuery = ref('')
const rowSelection = ref<RowSelectionState>({})

const editForm = reactive({
  name: '',
  description: '',
  slug: ''
})
const slugTouched = ref(false)
const autoSlug = computed({
  get: () => !slugTouched.value,
  set: (v: boolean) => {
    slugTouched.value = !v
    if (v) {
      // When turning auto on, sync immediately from name
      editForm.slug = slugify(editForm.name || '')
    }
  }
})

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

const unaColumns = [
  { id: 'row_actions', header: '', enableSorting: false },
  { accessorKey: 'pathname', header: 'Image', enableSorting: false },
  { accessorKey: 'user_name', header: 'Owner', enableSorting: true },
  { accessorKey: 'stats_views', header: 'Views', enableSorting: true },
  { accessorKey: 'stats_downloads', header: 'Downloads', enableSorting: true },
  { accessorKey: 'stats_likes', header: 'Likes', enableSorting: true },
  { accessorKey: 'created_at', header: 'Created', enableSorting: true },
  // trailing placeholder to balance UI if needed
]

const bulkActions: AdminBulkAction[] = [
  {
    id: 'delete_selected',
    label: 'Delete Selected',
    icon: 'i-ph-trash',
    variant: 'soft-red',
    confirmMessage: 'Are you sure you want to delete the selected images? This action cannot be undone.'
  },
  {
    id: 'regenerate_thumbnails',
    label: 'Regenerate Thumbnails',
    icon: 'i-ph-arrows-clockwise',
    variant: 'soft-blue',
    confirmMessage: 'Rebuild thumbnails for selected images? This may take a while.'
  }
]

const selectedImages = computed(() => {
  const selected = new Set(
    Object.entries(rowSelection.value)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
  )
  return images.value.filter(img => selected.has(String(img.id)))
})

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

let searchTimeout: any
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 400)
}

const handleSearch = (searchTerm?: string) => {
  filters.value.search = searchTerm ?? searchQuery.value
  pagination.value.page = 1
  fetchImages()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchImages()
}

const handleBulkAction = async (actionId: string) => {
  const rows = selectedImages.value
  if (actionId === 'regenerate_thumbnails') {
    for (const row of rows) {
      try {
        await $fetch(`/api/admin/images/${row.id}/regenerate`, { method: 'POST' as any })
      } catch (e) {
        console.error('Failed to regenerate', row.id, e)
      }
    }
    toast({ title: 'Regeneration', description: `Requested for ${rows.length} image(s).`, toast: 'soft-success' })
    return
  }

  if (actionId === 'delete_selected') {
    if (rows.length === 0) return
    const confirmed = window.confirm(`Delete ${rows.length} selected image${rows.length > 1 ? 's' : ''}? This cannot be undone.`)
    if (!confirmed) return

    const currentUserId = user.value?.id
    const owned = currentUserId != null ? rows.filter(r => r.user_id === currentUserId) : []
    const others = currentUserId != null ? rows.filter(r => r.user_id !== currentUserId) : rows

    let successCount = 0
    const failed: Array<{ id: number; reason: string }> = []

    // Bulk delete for owned images
    if (owned.length > 0) {
      try {
        const resp: any = await $fetch('/api/images/bulk-delete', {
          method: 'POST',
          body: { imageIds: owned.map(i => i.id) }
        })
        if (resp?.success) {
          const deletedIds: number[] = (resp.deleted || []).map((d: any) => d.id)
          successCount += deletedIds.length
          // Append failures if any
          for (const f of (resp.failed || [])) {
            failed.push({ id: f.id, reason: f.error || 'Failed' })
          }
          // Remove locally
          if (deletedIds.length > 0) {
            images.value = images.value.filter(img => !deletedIds.includes(img.id))
            // clear selection
            for (const id of deletedIds) {
              delete (rowSelection.value as any)[String(id)]
            }
          }
        }
      } catch (e: any) {
        // If bulk call fails entirely, fall back per-id for owned
        for (const r of owned) {
          try {
            const delResp: any = await $fetch(`/api/admin/images/${r.id}`, { method: 'DELETE' })
            if (delResp?.success) {
              successCount += 1
              images.value = images.value.filter(img => img.id !== r.id)
              delete (rowSelection.value as any)[String(r.id)]
            } else {
              failed.push({ id: r.id, reason: 'Failed' })
            }
          } catch (err) {
            failed.push({ id: r.id, reason: 'Error' })
          }
        }
      }
    }

    // Admin delete for others
    if (others.length > 0) {
      for (const r of others) {
        try {
          const delResp: any = await $fetch(`/api/admin/images/${r.id}`, { method: 'DELETE' })
          if (delResp?.success) {
            successCount += 1
            images.value = images.value.filter(img => img.id !== r.id)
            delete (rowSelection.value as any)[String(r.id)]
          } else {
            failed.push({ id: r.id, reason: 'Failed' })
          }
        } catch (err) {
          failed.push({ id: r.id, reason: 'Error' })
        }
      }
    }

    // Update pagination total
    if (successCount > 0) {
      pagination.value.total = Math.max(0, pagination.value.total - successCount)
    }

    // Feedback
    if (failed.length === 0) {
      toast({ title: 'Deleted', description: `Successfully deleted ${successCount} image${successCount > 1 ? 's' : ''}.`, toast: 'soft-success' })
    } else if (successCount > 0) {
      toast({ title: 'Partial', description: `Deleted ${successCount}, ${failed.length} failed.`, toast: 'soft-warning' })
    } else {
      toast({ title: 'Failed', description: `Could not delete selected images.`, toast: 'soft-error' })
    }

    // If page is empty after deletion, refetch current page
    if (images.value.length === 0 && (pagination.value.page > 1 || pagination.value.hasNext)) {
      await fetchImages()
    }
  }
}

const viewImage = (image: Image) => {
  selectedImage.value = image
  isViewDialogOpen.value = true
}

const editImage = (image: Image) => {
  // Open inline edit dialog
  selectedImage.value = image
  editForm.name = image.name
  editForm.description = image.description || ''
  editForm.slug = image.slug
  // If existing slug differs from slugified name, consider it manually edited
  slugTouched.value = image.slug ? slugify(image.name) !== image.slug : false
  isViewDialogOpen.value = false
  isEditDialogOpen.value = true
}

const regenerateOne = async (image: Image) => {
  try {
    await $fetch(`/api/admin/images/${image.id}/regenerate`, { method: 'POST' as any })
    toast({ title: 'Regenerated', description: 'Thumbnails updated', toast: 'soft-success' })
  } catch (e) {
    toast({ title: 'Failed', description: 'Could not regenerate', toast: 'soft-error' })
  }
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

const handleImageError = (payload: string | Event) => {
  const evt = payload as Event
  const img = evt?.target as HTMLImageElement | undefined
  if (img && 'src' in img) {
    img.src = '/loading.jpg'
  }
}

// Helpers
const slugify = (str: string) => str
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')

// Auto-update slug when name changes unless user manually edits slug
watch(() => editForm.name, (newName) => {
  if (!slugTouched.value) {
    editForm.slug = slugify(newName || '')
  }
})

const saveEditedImage = async () => {
  if (!selectedImage.value) return
  const id = selectedImage.value.id
  const payload = {
    name: editForm.name?.trim() || '',
    description: editForm.description?.trim() || '',
    slug: slugify(editForm.slug || '')
  }

  if (!payload.name || !payload.slug) {
    toast({ title: 'Invalid form', description: 'Name and slug are required.', toast: 'soft-warning' })
    return
  }

  isSavingEdit.value = true
  try {
    const resp: any = await $fetch(`/api/images/${id}`, { method: 'PATCH' as any, body: payload })
    if (resp?.success) {
      // Update local selected image and list minimally to preserve extra fields (owner info)
      const idx = images.value.findIndex(img => img.id === id)
      if (idx !== -1 && images.value[idx]) {
        const existing = images.value[idx]
        images.value[idx] = { ...existing, name: payload.name, description: payload.description, slug: payload.slug }
      }
      if (selectedImage.value) {
        selectedImage.value = { ...selectedImage.value, name: payload.name, description: payload.description, slug: payload.slug }
      }

      isEditDialogOpen.value = false
      toast({ title: 'Saved', description: 'Image updated successfully.', toast: 'soft-success' })
    }
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Failed to update image.'
    toast({ title: 'Error', description: msg, toast: 'soft-error' })
  } finally {
    isSavingEdit.value = false
  }
}

// Row click handler
const onRowClick = (event: Event, row: Image) => {
  const target = event.target as HTMLElement
  if (target.closest('button') || target.closest('a') || target.closest('input')) return
  viewImage(row)
}

// Dropdown menu items for each row
const imageRowMenuItems = (row: Image) => [
  {
    label: 'View',
    onClick: () => viewImage(row)
  },
  {
    label: 'Regenerate thumbnails',
    onClick: () => regenerateOne(row)
  },
  {
    label: 'Edit',
    onClick: () => editImage(row)
  },
  {
    label: 'Delete',
    onClick: () => showDeleteDialog(row)
  }
]

// Helpers to resolve image variant sources from JSON string
const parseVariants = (variants: string | VariantType[] | null | undefined): VariantType[] => {
  try {
    if (!variants) return []
    if (Array.isArray(variants)) return variants
    const parsed = JSON.parse(variants) as VariantType[]
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

const getVariantSrc = (row: { variants?: string | VariantType[]; pathname?: string }, preferredSizes: string[] = ['xxs', 'xs', 'sm']): string => {
  const list = parseVariants(row?.variants as any)
  let found: VariantType | undefined
  for (const size of preferredSizes) {
    found = list.find(v => v.size === size)
    if (found) break
  }
  if (!found && list.length > 0) {
    found = list[0]
  }
  const path = found?.pathname || row?.pathname || ''
  // Ensure leading slash for hubblob provider
  return path.startsWith('/') ? path : `/${path}`
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
