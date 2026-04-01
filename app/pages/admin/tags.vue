<template>
  <div class="space-y-6">
    <!-- Create tag button -->
    <div class="flex justify-end">
      <button
        class="px-4 h-9 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1.5"
        @click="showCreateModal = true"
      >
        <span class="i-ph-plus text-sm"></span>
        New Tag
      </button>
    </div>

    <AdminTable
      title="Tags"
      description="Manage tags used throughout the system"
      :columns="unaColumns"
      :data="tags"
      :loading="isLoading"
      :pagination="pagination"
      :bulk-actions="bulkActions"
      empty-message="No tags found."
      @search="handleSearch"
      @refresh="fetchTags"
      @page-change="handlePageChange"
      @bulk-action="handleBulkAction"
      @row-click="editTag"
      @edit="editTag"
      @delete="deleteTag"
    >
      <!-- Tag name with color dot -->
      <template #name-cell="{ row }">
        <div class="flex items-center gap-2.5">
          <div
            class="w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
            :style="{ backgroundColor: row.color || '#94a3b8' }"
          ></div>
          <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ row.name }}</p>
          <p v-if="row.description" class="text-xs text-stone-400 dark:text-zinc-500 truncate max-w-36">{{ row.description }}</p>
        </div>
      </template>

      <!-- Usage count -->
      <template #usage_count-cell="{ row }">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400 tabular-nums">
          {{ row.usage_count ?? 0 }}
        </span>
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

    <!-- Create / Edit Tag Dialog -->
    <NDialog v-model:open="showCreateModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {{ editingTag ? 'Edit Tag' : 'New Tag' }}
          </h3>

          <div class="space-y-1">
            <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Name *</label>
            <input v-model="tagForm.name" type="text" placeholder="Tag name"
              class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Description</label>
            <input v-model="tagForm.description" type="text" placeholder="Optional description"
              class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Color</label>
            <div class="flex items-center gap-3">
              <input v-model="tagForm.color" type="color"
                class="w-10 h-9 rounded-lg border border-stone-200 dark:border-zinc-700 cursor-pointer bg-transparent" />
              <span class="text-sm font-mono text-stone-500 dark:text-zinc-400">{{ tagForm.color }}</span>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
              @click="showCreateModal = false"
            >Cancel</button>
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
              :disabled="!tagForm.name.trim() || isSubmitting"
              @click="submitTag"
            >
              <span v-if="isSubmitting" class="i-ph-spinner-gap animate-spin mr-1.5 inline-block"></span>
              {{ editingTag ? 'Save Changes' : 'Create Tag' }}
            </button>
          </div>
        </div>
      </template>
    </NDialog>

    <!-- Delete Tag Dialog -->
    <NDialog v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6">
          <div class="flex items-start gap-4 mb-6">
            <div class="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
              <span class="i-ph-warning text-rose-600 dark:text-rose-400 text-xl"></span>
            </div>
            <div>
              <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Delete Tag</h3>
              <p class="text-sm text-stone-500 dark:text-zinc-400">
                Delete <strong class="text-zinc-700 dark:text-zinc-300">{{ tagToDelete?.name }}</strong>?
                <span v-if="tagToDelete && tagToDelete.usage_count > 0" class="block mt-1 text-amber-600 dark:text-amber-400">This tag is used by {{ tagToDelete.usage_count }} image(s). Deleting will remove it from all images.</span>
              </p>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
              @click="showDeleteModal = false"
            >Cancel</button>
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-60"
              :disabled="isDeleting"
              @click="confirmDelete"
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
import type { Tag, TagSearchResponse, TagCreateRequest } from '~~/shared/types/tag'
import type { Pagination } from '~~/shared/types/pagination'
import type { AdminBulkAction } from '~~/shared/types/admin'

const { toast } = useToast()

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

// State
const tags = ref<Tag[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const searchQuery = ref('')
const selectedSortLabel = ref('Usage Count')
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const editingTag = ref<Tag | null>(null)
const tagToDelete = ref<Tag | null>(null)
const pagination = ref<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false })

const tagForm = ref<TagCreateRequest>({
  name: '',
  description: '',
  color: '#3B82F6'
})

const sortLabelToKey: Record<string, string> = {
  'Usage Count': 'usage_count',
  'Name': 'name',
  'Created Date': 'created_at'
}

const unaColumns = [
  { accessorKey: 'name', header: 'Tag' },
  { accessorKey: 'usage_count', header: 'Usage' },
  { accessorKey: 'created_at', header: 'Created' },
]

const bulkActions: AdminBulkAction[] = [
  { id: 'delete_selected', label: 'Delete Selected', icon: 'i-ph-trash', variant: 'soft-red' },
]

const fetchTags = async () => {
  isLoading.value = true
  try {
    const response = await $fetch<TagSearchResponse>('/api/tags', {
      query: {
        query: searchQuery.value,
        sort_by: sortLabelToKey[selectedSortLabel.value] || 'usage_count',
        sort_order: (sortLabelToKey[selectedSortLabel.value] || 'usage_count') === 'name' ? 'asc' : 'desc',
        limit: pagination.value.limit,
        offset: (pagination.value.page - 1) * pagination.value.limit
      }
    })
    tags.value = response.tags
    const { total, pagination: pag } = response
    pagination.value = {
      page: pag.page,
      limit: pag.limit,
      total,
      totalPages: pag.total_pages,
      hasNext: pag.page * pag.limit < total,
      hasPrev: pag.page > 1
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    toast({ title: 'Error', description: 'Failed to fetch tags.', toast: 'soft-error' })
  } finally {
    isLoading.value = false
  }
}

const handleSearch = (term: string) => {
  searchQuery.value = term
  pagination.value.page = 1
  fetchTags()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchTags()
}

const handleBulkAction = async (actionId: string, selectedRows: any[]) => {
  const rows = selectedRows as Tag[]
  if (rows.length === 0) return

  if (actionId === 'delete_selected') {
    const confirmed = window.confirm(`Delete ${rows.length} selected tag${rows.length > 1 ? 's' : ''}?`)
    if (!confirmed) return
    for (const t of rows) {
      try {
        await $fetch(`/api/tags/${t.id}`, { method: 'DELETE', query: { force: (t as any).usage_count > 0 ? 'true' : 'false' } })
      } catch {}
    }
    toast({ title: 'Deleted', description: `Deleted ${rows.length} tag(s).`, toast: 'soft-success' })
    await fetchTags()
  }
}

const editTag = (tag: Tag) => {
  editingTag.value = tag
  tagForm.value = {
    name: tag.name,
    description: tag.description,
    color: tag.color
  }
  showCreateModal.value = true
}

const submitTag = async () => {
  if (!tagForm.value.name.trim()) return
  isSubmitting.value = true
  try {
    if (editingTag.value) {
      await $fetch(`/api/tags/${editingTag.value.id}`, { method: 'PATCH', body: tagForm.value })
    } else {
      await $fetch('/api/tags', { method: 'POST', body: tagForm.value })
    }
    showCreateModal.value = false
    resetForm()
    await fetchTags()
  } catch (error) {
    console.error('Failed to save tag:', error)
    toast({ title: 'Error', description: 'Failed to save tag.', toast: 'soft-error' })
  } finally {
    isSubmitting.value = false
  }
}

const deleteTag = (tag: Tag) => {
  tagToDelete.value = tag
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!tagToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/tags/${tagToDelete.value.id}`, {
      method: 'DELETE',
      query: { force: tagToDelete.value.usage_count > 0 ? 'true' : 'false' }
    })
    showDeleteModal.value = false
    await fetchTags()
  } catch (error) {
    console.error('Failed to delete tag:', error)
    toast({ title: 'Error', description: 'Failed to delete tag.', toast: 'soft-error' })
  } finally {
    isDeleting.value = false
  }
}

const resetForm = () => {
  editingTag.value = null
  tagForm.value = { name: '', description: '', color: '#3B82F6' }
}

watch(() => showCreateModal.value, (isOpen) => {
  if (!isOpen) resetForm()
})

onMounted(() => fetchTags())
</script>
