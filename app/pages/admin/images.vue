<template>
  <div class="space-y-6">
    <AdminTable
      title="Images"
      description="Manage all illustrations in the system"
      :columns="unaColumns"
      :data="images"
      :loading="isLoading"
      :pagination="pagination"
      :bulk-actions="bulkActions"
      :keyboard-nav="true"
      empty-message="No images found. Upload some to get started."
      @search="handleSearch"
      @refresh="fetchImages"
      @page-change="handlePageChange"
      @bulk-action="handleBulkAction"
      @row-click="viewImage"
      @edit="editImage"
      @delete="showDeleteDialog"
      @duplicate="handleDuplicate"
    >
      <!-- Thumbnail + name -->
      <template #pathname-cell="{ row }">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 dark:bg-zinc-800">
            <NuxtImg
              v-if="getVariantSrc(row)"
              :src="getVariantSrc(row)"
              provider="hubblob"
              :alt="row.name"
              class="w-full h-full object-cover"
              @error="handleImageError"
            />
            <span v-else class="i-ph-image text-stone-300 dark:text-zinc-600 w-full h-full flex items-center justify-center text-xl"></span>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-40">{{ row.name }}</p>
            <p class="text-xs text-stone-400 dark:text-zinc-500 truncate max-w-40">{{ row.pathname }}</p>
          </div>
        </div>
      </template>

      <!-- Owner -->
      <template #user_name-cell="{ row }">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
            {{ (row.user_name || row.user_email || '?')[0]?.toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-32">{{ row.user_name || '—' }}</p>
            <p class="text-xs text-stone-400 dark:text-zinc-500 truncate max-w-32">{{ row.user_email || '' }}</p>
          </div>
        </div>
      </template>

      <!-- Stats cells -->
      <template #stats_views-cell="{ row }">
        <div class="flex items-center gap-1.5 text-stone-500 dark:text-zinc-400">
          <span class="i-ph-eye text-sm"></span>
          <span class="text-sm tabular-nums">{{ (row.stats_views ?? 0).toLocaleString() }}</span>
        </div>
      </template>
      <template #stats_downloads-cell="{ row }">
        <div class="flex items-center gap-1.5 text-stone-500 dark:text-zinc-400">
          <span class="i-ph-download-simple text-sm"></span>
          <span class="text-sm tabular-nums">{{ (row.stats_downloads ?? 0).toLocaleString() }}</span>
        </div>
      </template>
      <template #stats_likes-cell="{ row }">
        <div class="flex items-center gap-1.5 text-stone-500 dark:text-zinc-400">
          <span class="i-ph-heart text-sm"></span>
          <span class="text-sm tabular-nums">{{ (row.stats_likes ?? 0).toLocaleString() }}</span>
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

      <!-- Actions override: Variants, Duplicate, Replace, Add to Collection, Edit, Delete -->
      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            title="Upload variant"
            @click.stop="openAspectUpload(row)"
          >
            <span class="text-sm i-ph-upload-simple"></span>
          </button>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            title="Aspect Variants"
            @click.stop="openAspectVariants(row)"
          >
            <span class="text-sm i-ph-crop"></span>
          </button>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            title="Duplicate"
            @click.stop="handleDuplicate({ highlighted: row, selected: [] })"
          >
            <span class="text-sm i-ph-copy-simple"></span>
          </button>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            title="Replace"
            @click.stop="handleReplace(row)"
          >
            <span class="text-sm i-ph-swap"></span>
          </button>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            title="Add to Collection"
            @click.stop="handleAddToCollection(row)"
          >
            <span class="text-sm i-ph-folder-plus"></span>
          </button>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            title="Edit"
            @click.stop="editImage(row)"
          >
            <span class="text-sm i-ph-pencil-simple"></span>
          </button>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600 sm:h-7 sm:w-7 dark:text-zinc-500 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
            title="Delete"
            @click.stop="showDeleteDialog(row)"
          >
            <span class="text-sm i-ph-trash-simple"></span>
          </button>
        </div>
      </template>
    </AdminTable>

    <AdminImageViewDialog
      v-model:is-open="isViewDialogOpen"
      :image="selectedImage"
      @edit="editImage"
    />

    <!-- Delete Confirmation Dialog -->
    <NDialog v-model:open="isDeleteDialogOpen">
      <template #content>
        <div class="p-6">
          <div class="flex items-start gap-4 mb-6">
            <div class="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
              <span class="i-ph-warning text-rose-600 dark:text-rose-400 text-xl"></span>
            </div>
            <div>
              <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Delete Image</h3>
              <p class="text-sm text-stone-500 dark:text-zinc-400">
                Are you sure you want to delete <strong class="text-zinc-700 dark:text-zinc-300">{{ selectedImage?.name }}</strong>? This action cannot be undone.
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
              @click="deleteImage"
            >
              <span v-if="isDeleting" class="i-ph-spinner-gap animate-spin mr-1.5 inline-block"></span>
              Delete
            </button>
          </div>
        </div>
      </template>
    </NDialog>

    <!-- Edit Image Dialog -->
    <NDialog v-model:open="isEditDialogOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Edit Image</h3>

          <div class="space-y-1">
            <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Name *</label>
            <input
              v-model="editForm.name"
              type="text"
              placeholder="Image name"
              class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
            />
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Slug *</label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input v-model="autoSlug" type="checkbox" class="w-3 h-3 rounded text-indigo-500" />
                <span class="text-xs text-stone-400 dark:text-zinc-500">Auto-generate</span>
              </label>
            </div>
            <input
              v-model="editForm.slug"
              type="text"
              placeholder="image-slug"
              :disabled="autoSlug"
              class="w-full px-3 h-9 rounded-lg text-sm font-classic bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 transition disabled:opacity-50"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Description</label>
            <textarea
              v-model="editForm.description"
              placeholder="Image description"
              rows="3"
              class="w-full px-3 py-2 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 transition resize-none"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
              @click="isEditDialogOpen = false"
            >Cancel</button>
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-60"
              :disabled="!editForm.name || !editForm.slug || isSavingEdit"
              @click="saveEditedImage"
            >
              <span v-if="isSavingEdit" class="i-ph-spinner-gap animate-spin mr-1.5 inline-block"></span>
              Save Changes
            </button>
          </div>
        </div>
      </template>
    </NDialog>

    <!-- Hidden file input for replace -->
    <input
      ref="replaceInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleReplaceFileSelect"
    />

    <!-- Add to Collection Modal -->
    <AddToCollectionModal
      v-model:is-open="addToCollection.isOpen.value"
      :selected-image="addToCollection.selectedImage.value"
      :collections="addToCollection.collections.value"
      :selected-collection="addToCollection.selectedCollection.value"
      :is-loading="addToCollection.isLoading.value"
      :is-adding="addToCollection.isAdding.value"
      :error="addToCollection.error.value"
      @add-to-collection="addToCollection.addImageToCollection"
      @select-collection="addToCollection.selectCollection"
    />

    <!-- Add to Collection Drawer (mobile) -->
    <AddToCollectionDrawer
      v-model:is-open="addToCollection.isDrawerOpen.value"
      :selected-image="addToCollection.selectedImage.value"
      :collections="addToCollection.collections.value"
      :selected-collection="addToCollection.selectedCollection.value"
      :is-loading="addToCollection.isLoading.value"
      :is-adding="addToCollection.isAdding.value"
      :error="addToCollection.error.value"
      @add-to-collection="addToCollection.addImageToCollection"
      @select-collection="addToCollection.selectCollection"
    />

    <!-- Aspect Variants Dialog -->
    <AspectVariantDialog
      v-model:is-open="isAspectVariantDialogOpen"
      :image="aspectVariantImage"
      :variants="aspectVariantList"
      @update:variants="aspectVariantList = $event"
    />

    <!-- Aspect Upload Dialog -->
    <AspectUploadDialog
      v-model:is-open="isAspectUploadDialogOpen"
      :parent-image="aspectUploadParent"
      @complete="fetchImages"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Image, VariantType } from '~~/shared/types/image'
import type { Pagination } from '~~/shared/types/pagination'
import type { AdminBulkAction } from '~~/shared/types/admin'
import { useAddToCollectionModal } from '~/composables/collection/useAddToCollectionModal'

const { user } = useUserSession()
const { toast } = useToast()
const { showErrorToast } = useErrorToast()

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
const isReplacing = ref(false)
const replaceInputRef = ref<HTMLInputElement>()

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
      editForm.slug = slugify(editForm.name || '')
    }
  }
})

const addToCollection = useAddToCollectionModal()

// Aspect variant management
const isAspectVariantDialogOpen = ref(false)
const aspectVariantImage = ref<Image | null>(null)
const aspectVariantList = ref<Image[]>([])
const isAspectUploadDialogOpen = ref(false)
const aspectUploadParent = ref<Image | null>(null)

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
  { accessorKey: 'pathname', header: 'Image' },
  { accessorKey: 'user_name', header: 'Owner' },
  { accessorKey: 'stats_views', header: 'Views' },
  { accessorKey: 'stats_downloads', header: 'Downloads', hideOnMobile: true },
  { accessorKey: 'stats_likes', header: 'Likes', hideOnMobile: true },
  { accessorKey: 'created_at', header: 'Added', hideOnMobile: true },
]

const bulkActions: AdminBulkAction[] = [
  { id: 'delete_selected', label: 'Delete Selected', icon: 'i-ph-trash', variant: 'soft-red' },
  { id: 'regenerate_thumbnails', label: 'Regenerate Thumbnails', icon: 'i-ph-arrows-clockwise', variant: 'soft-blue' },
]

// Methods
const fetchImages = async () => {
  isLoading.value = true
  try {
    const query = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    })
    if (filters.value.search) query.append('search', filters.value.search)
    if (filters.value.userId) query.append('userId', filters.value.userId)

    const response = await $fetch(`/api/admin/images?${query.toString()}`)
    if (response.success) {
      images.value = response.data.images
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('Error fetching images:', error)
    showErrorToast(error, 'Error', 'Failed to fetch images.')
  } finally {
    isLoading.value = false
  }
  openImageFromRoute()
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

const handleBulkAction = async (actionId: string, selectedRows: any[]) => {
  const rows = selectedRows as (Image & { user_name: string; user_email: string })[]

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

    if (owned.length > 0) {
      try {
        const resp: any = await $fetch('/api/images/bulk-delete', {
          method: 'POST',
          body: { imageIds: owned.map(i => i.id) }
        })
        if (resp?.success) {
          const deletedIds: number[] = (resp.deleted || []).map((d: any) => d.id)
          successCount += deletedIds.length
          for (const f of (resp.failed || [])) failed.push({ id: f.id, reason: f.error || 'Failed' })
          if (deletedIds.length > 0) images.value = images.value.filter(img => !deletedIds.includes(img.id))
        }
      } catch {
        for (const r of owned) {
          try {
            const delResp: any = await $fetch(`/api/admin/images/${r.id}`, { method: 'DELETE' })
            if (delResp?.success) {
              successCount += 1
              images.value = images.value.filter(img => img.id !== r.id)
            } else {
              failed.push({ id: r.id, reason: 'Failed' })
            }
          } catch {
            failed.push({ id: r.id, reason: 'Error' })
          }
        }
      }
    }

    for (const r of others) {
      try {
        const delResp: any = await $fetch(`/api/admin/images/${r.id}`, { method: 'DELETE' })
        if (delResp?.success) {
          successCount += 1
          images.value = images.value.filter(img => img.id !== r.id)
        } else {
          failed.push({ id: r.id, reason: 'Failed' })
        }
      } catch {
        failed.push({ id: r.id, reason: 'Error' })
      }
    }

    if (successCount > 0) pagination.value.total = Math.max(0, pagination.value.total - successCount)

    if (failed.length === 0) {
      // Success is visually evident from the updated list
    } else if (successCount > 0) {
      toast({ title: 'Partial', description: `Deleted ${successCount}, ${failed.length} failed.`, toast: 'soft-warning' })
    } else {
      toast({ title: 'Failed', description: 'Could not delete selected images.', toast: 'soft-error' })
    }

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
  selectedImage.value = image
  editForm.name = image.name
  editForm.description = image.description || ''
  editForm.slug = image.slug
  slugTouched.value = image.slug ? slugify(image.name) !== image.slug : false
  isViewDialogOpen.value = false
  isEditDialogOpen.value = true
}

const showDeleteDialog = (image: Image) => {
  selectedImage.value = image
  isDeleteDialogOpen.value = true
}

const deleteImage = async () => {
  if (!selectedImage.value) return
  isDeleting.value = true
  try {
    const response = await $fetch(`/api/admin/images/${selectedImage.value.id}`, { method: 'DELETE' })
    if (response.success) {
      images.value = images.value.filter(img => img.id !== selectedImage.value!.id)
      isDeleteDialogOpen.value = false
      pagination.value.total--
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    showErrorToast(error, 'Error', 'Failed to delete image.')
  } finally {
    isDeleting.value = false
  }
}

const handleDuplicate = async (payload: { highlighted: any; selected: any[] }) => {
  const image = payload?.highlighted
  if (!image) {
    toast({ title: 'No Image', description: 'Select an image to duplicate.', toast: 'soft-warning', duration: 3000 })
    return
  }

  try {
    const response: any = await $fetch(`/api/admin/images/${image.id}/duplicate`, { method: 'POST' })
    if (response.success && response.data) {
      const duplicated = {
        ...response.data,
        user_name: user.value?.name || '—',
        user_email: user.value?.email || '',
      }
      images.value.unshift(duplicated)
      pagination.value.total++
    }
  } catch (error) {
    console.error('Error duplicating image:', error)
    showErrorToast(error, 'Error', 'Failed to duplicate image.')
  }
}

const handleImageError = (payload: string | Event) => {
  const evt = payload as Event
  const img = evt?.target as HTMLImageElement | undefined
  if (img && 'src' in img) img.src = '/loading.jpg'
}

const slugify = (str: string) => str
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')

watch(() => editForm.name, (newName) => {
  if (!slugTouched.value) editForm.slug = slugify(newName || '')
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
      const idx = images.value.findIndex(img => img.id === id)
      if (idx !== -1 && images.value[idx]) {
        images.value[idx] = { ...images.value[idx], name: payload.name, description: payload.description, slug: payload.slug }
      }
      if (selectedImage.value) {
        selectedImage.value = { ...selectedImage.value, name: payload.name, description: payload.description, slug: payload.slug }
      }
      isEditDialogOpen.value = false
    }
  } catch (e: any) {
    showErrorToast(e, 'Error', 'Failed to update image.')
  } finally {
    isSavingEdit.value = false
  }
}

const handleReplace = (image: Image) => {
  selectedImage.value = image
  nextTick(() => {
    replaceInputRef.value?.click()
  })
}

const handleReplaceFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  if (!file) return

  const image = selectedImage.value
  if (!image || !file.type.startsWith('image/')) {
    input.value = ''
    return
  }

  isReplacing.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    formData.append('type', file.type)
    formData.append('imageId', String(image.id))

    const response: any = await $fetch(`/api/images/id/${image.id}/replace`, {
      method: 'POST',
      body: formData,
    })

    if (response.success && response.results?.length) {
      const updated = response.results[0] as Record<string, any>
      const idx = images.value.findIndex(img => img.id === image.id)
      if (idx !== -1 && images.value[idx]) {
        const current = images.value[idx]
        images.value[idx] = {
          ...current,
          pathname: updated.pathname || current.pathname,
          variants: updated.variants || current.variants,
          updated_at: updated.updated_at || updated.updatedAt || current.updated_at,
        }
      }
    } else {
      showErrorToast('Failed to replace image.', 'Error')
    }
  } catch (error) {
    console.error('Error replacing image:', error)
    showErrorToast(error, 'Error', 'Failed to replace image.')
  } finally {
    isReplacing.value = false
    input.value = ''
  }
}

const handleAddToCollection = (image: Image) => {
  selectedImage.value = image
  addToCollection.openModal(image)
}

const openAspectVariants = async (image: Image) => {
  aspectVariantImage.value = image
  try {
    const resp: any = await $fetch(`/api/images/slug/${image.slug}`)
    aspectVariantList.value = resp?.aspect_variants || []
  } catch {
    aspectVariantList.value = []
  }
  isAspectVariantDialogOpen.value = true
}

const openAspectUpload = (image: Image) => {
  aspectUploadParent.value = image
  isAspectUploadDialogOpen.value = true
}

// Helpers
const parseVariants = (variants: string | VariantType[] | null | undefined): VariantType[] => {
  try {
    if (!variants) return []
    if (Array.isArray(variants)) return variants
    const parsed = JSON.parse(variants) as VariantType[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getVariantSrc = (row: { variants?: string | VariantType[]; pathname?: string } | null, preferredSizes: string[] = ['xxs', 'xs', 'sm']): string => {
  if (!row) return ''
  const list = parseVariants(row?.variants as any)
  let found: VariantType | undefined
  for (const size of preferredSizes) {
    found = list.find(v => v.size === size)
    if (found) break
  }
  if (!found && list.length > 0) found = list[0]
  const path = found?.pathname || row?.pathname || ''
  return path.startsWith('/') ? path : `/${path}`
}

// --- URL-driven dialog ---
const route = useRoute()
const router = useRouter()

const openImageFromRoute = () => {
  const id = route.query.imageId
  if (!id || !images.value.length) return
  const found = images.value.find(img => img.id === Number(id))
  if (found) viewImage(found)
}

watch(() => route.query.imageId, () => openImageFromRoute())

watch(isViewDialogOpen, (open) => {
  if (!open && route.query.imageId) {
    const q = { ...route.query }
    delete q.imageId
    router.replace({ query: q })
  }
})

onMounted(() => fetchImages())
</script>
