<template>
  <div class="space-y-6">
    <section class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
      <div class="admin-card overflow-hidden border-none bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,245,244,0.94))] p-5 shadow-sm dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.98),rgba(17,24,39,0.94))] sm:p-6">
        <p class="text-xs font-medium uppercase tracking-[0.22em] text-stone-400 dark:text-zinc-500">Library</p>
        <h2 class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Illustrations, ownership and quick cleanup</h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-stone-500 dark:text-zinc-400">
          Keep uploads tidy, inspect who owns what, and spot high-performing pieces without leaving the management view.
        </p>

        <div class="mt-5 flex flex-wrap gap-2">
          <span class="admin-badge admin-badge-stone">{{ pagination.total }} total images</span>
          <span class="admin-badge admin-badge-amber">{{ images.length }} on this page</span>
          <span class="admin-badge admin-badge-cyan">{{ visibleOwners }} active owners here</span>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        <div class="admin-card p-4">
          <p class="text-[11px] uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Visible views</p>
          <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ visibleImageViews.toLocaleString() }}</p>
          <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">Combined view count on the current page.</p>
        </div>
        <div class="admin-card p-4">
          <p class="text-[11px] uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Visible likes</p>
          <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ visibleImageLikes.toLocaleString() }}</p>
          <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">A quick signal for what resonates now.</p>
        </div>
        <div class="admin-card p-4">
          <p class="text-[11px] uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Current page</p>
          <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ pagination.page }} / {{ Math.max(1, pagination.totalPages) }}</p>
          <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">Pagination stays light while the layout remains readable.</p>
        </div>
      </div>
    </section>

    <AdminTable
      title="Images"
      description="Manage all illustrations in the system"
      :columns="unaColumns"
      :data="images"
      :loading="isLoading"
      :pagination="pagination"
      :bulk-actions="bulkActions"
      empty-message="No images found. Upload some to get started."
      @search="handleSearch"
      @refresh="fetchImages"
      @page-change="handlePageChange"
      @bulk-action="handleBulkAction"
      @row-click="viewImage"
      @edit="editImage"
      @delete="showDeleteDialog"
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
          <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
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
    </AdminTable>

    <!-- View Image Dialog -->
    <NDialog v-model:open="isViewDialogOpen" :_dialog="{ class: 'max-w-3xl' }">
      <template #content>
        <div v-if="selectedImage" class="p-6">
          <div class="flex items-start justify-between mb-6">
            <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{{ selectedImage.name }}</h2>
            <button @click="isViewDialogOpen = false" class="text-stone-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
              <span class="i-ph-x text-lg"></span>
            </button>
          </div>

          <!-- Image preview -->
          <div class="aspect-video rounded-xl overflow-hidden bg-stone-100 dark:bg-zinc-800 mb-6">
            <NuxtImg
              :src="getVariantSrc(selectedImage, ['lg', 'md', 'sm'])"
              provider="hubblob"
              :alt="selectedImage.name"
              class="w-full h-full object-contain"
              @error="handleImageError"
            />
          </div>

          <!-- Info grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div v-if="selectedImage.description" class="col-span-2 sm:col-span-3">
              <p class="text-xs text-stone-400 dark:text-zinc-500 mb-1">Description</p>
              <p class="text-sm text-zinc-700 dark:text-zinc-300">{{ selectedImage.description }}</p>
            </div>
            <div>
              <p class="text-xs text-stone-400 dark:text-zinc-500 mb-1">Slug</p>
              <p class="text-sm font-classic text-zinc-700 dark:text-zinc-300">{{ selectedImage.slug }}</p>
            </div>
            <div>
              <p class="text-xs text-stone-400 dark:text-zinc-500 mb-1">Views</p>
              <p class="text-sm text-zinc-700 dark:text-zinc-300">{{ selectedImage.stats_views?.toLocaleString() ?? 0 }}</p>
            </div>
            <div>
              <p class="text-xs text-stone-400 dark:text-zinc-500 mb-1">Downloads</p>
              <p class="text-sm text-zinc-700 dark:text-zinc-300">{{ selectedImage.stats_downloads?.toLocaleString() ?? 0 }}</p>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-stone-200 dark:border-zinc-800">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
              @click="isViewDialogOpen = false"
            >Close</button>
            <NuxtLink
              :to="`/illustrations/${selectedImage.slug}`"
              target="_blank"
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <span class="i-ph-arrow-square-out text-sm"></span>
              View
            </NuxtLink>
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              @click="editImage(selectedImage)"
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
              class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition"
            />
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Slug *</label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input v-model="autoSlug" type="checkbox" class="w-3 h-3 rounded text-amber-500" />
                <span class="text-xs text-stone-400 dark:text-zinc-500">Auto-generate</span>
              </label>
            </div>
            <input
              v-model="editForm.slug"
              type="text"
              placeholder="image-slug"
              :disabled="autoSlug"
              class="w-full px-3 h-9 rounded-lg text-sm font-classic bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition disabled:opacity-50"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Description</label>
            <textarea
              v-model="editForm.description"
              placeholder="Image description"
              rows="3"
              class="w-full px-3 py-2 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition resize-none"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
              @click="isEditDialogOpen = false"
            >Cancel</button>
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
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
  </div>
</template>

<script lang="ts" setup>
import type { Image, VariantType } from '~~/shared/types/image'
import type { Pagination } from '~~/shared/types/pagination'
import type { AdminBulkAction } from '~~/shared/types/admin'

const { user } = useUserSession()
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
  { accessorKey: 'stats_downloads', header: 'Downloads' },
  { accessorKey: 'stats_likes', header: 'Likes' },
  { accessorKey: 'created_at', header: 'Added' },
]

const bulkActions: AdminBulkAction[] = [
  { id: 'delete_selected', label: 'Delete Selected', icon: 'i-ph-trash', variant: 'soft-red' },
  { id: 'regenerate_thumbnails', label: 'Regenerate Thumbnails', icon: 'i-ph-arrows-clockwise', variant: 'soft-blue' },
]

const visibleOwners = computed(() => {
  return new Set(images.value.map((image) => image.user_id ?? image.user_email ?? image.id)).size
})

const visibleImageViews = computed(() => {
  return images.value.reduce((total, image) => total + Number(image.stats_views ?? 0), 0)
})

const visibleImageLikes = computed(() => {
  return images.value.reduce((total, image) => total + Number(image.stats_likes ?? 0), 0)
})

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
    toast({ title: 'Error', description: 'Failed to fetch images.', toast: 'soft-error', duration: 5000 })
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
      toast({ title: 'Deleted', description: `Deleted ${successCount} image${successCount > 1 ? 's' : ''}.`, toast: 'soft-success' })
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
      toast({ title: 'Deleted', description: 'Image deleted successfully', toast: 'soft-success', duration: 3000 })
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    toast({ title: 'Error', description: 'Failed to delete image.', toast: 'soft-error', duration: 5000 })
  } finally {
    isDeleting.value = false
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
      toast({ title: 'Saved', description: 'Image updated successfully.', toast: 'soft-success' })
    }
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Failed to update image.'
    toast({ title: 'Error', description: msg, toast: 'soft-error' })
  } finally {
    isSavingEdit.value = false
  }
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

onMounted(() => fetchImages())
</script>
