<template>
  <div>
    <!-- Access Control -->
    <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
      <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
      <h2 class="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
      <p class="text-gray-600">You need admin privileges to access this page.</p>
      <NButton to="/user" class="mt-4">Go to Profile</NButton>
    </div>

    <!-- Tags Management -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-700 text-gray-900 dark:text-gray-200">Tag Management</h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1">Manage tags used throughout the system</p>
        </div>
        <NButton btn="solid-black" size="sm" @click="showCreateModal = true">
          <span class="i-ph-plus mr-2"></span>
          Create Tag
        </NButton>
      </div>

      <!-- Search and Actions Card -->
      <div class="rounded-[28px] p-6 bg-[#D1E0E9] dark:bg-gray-800">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <NInput
            v-model="searchQuery"
            placeholder="Search tags..."
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

          <div>
            <NSelect v-model="selectedSortLabel" :items="sortLabels" size="sm" />
          </div>

          <NButton
            @click="fetchTags"
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
        <div v-if="selectedTags.length > 0" class="flex items-center gap-2 mt-4 pt-4 border-t border-[#b7cbd8]">
          <span class="text-sm font-600 text-gray-700">
            {{ selectedTags.length }} selected
          </span>
          <NButton btn="soft-gray" size="sm" @click="openBulkColorDialog">
            <span class="i-ph-palette mr-2"></span>
            Set Color
          </NButton>
          <NButton btn="soft-error" size="sm" @click="handleBulkDelete">
            <span class="i-ph-trash mr-2"></span>
            Delete Selected
          </NButton>
        </div>
      </div>

      <!-- Table Card -->
      <div class="rounded-[28px] bg-[#D1E0E9] dark:bg-gray-800 overflow-hidden">
        <div class="p-6">
          <NTable
          :columns="unaColumns"
          :data="tags"
          :loading="isLoading"
          row-id="id"
          :enable-row-selection="true"
          :enable-multi-row-selection="true"
          v-model:rowSelection="rowSelection"
          @row="onRowClick"
          empty-text="No tags found."
          :una="{
            tableRoot: 'rounded-[28px] b-transparent',
            tableHead: 'b-transparent',
            tableRow: 'b-transparent cursor-pointer hover:bg-[#000000]/5',
            tableLoadingRow: 'bg-[#D1DFE9] b-[#D1DFE9] dark:bg-gray-700/50',
            tableEmpty: 'bg-[#D1DFE9] b-[#D1DFE9] dark:bg-gray-700/50',
            tableCell: 'table-cell',
          }"
        >
          <template #row_actions-cell="{ cell }">
            <ClientOnly>
              <NDropdownMenu
                :items="tagRowMenuItems(cell.row.original)"
                size="xs"
                dropdown-menu="link-pink"
                :_dropdown-menu-content="{ class: 'w-40', align: 'start', side: 'bottom' }"
                :_dropdown-menu-trigger="{ icon: true, square: true, label: 'i-lucide-ellipsis-vertical' }"
              />
              <template #fallback>
                <div class="w-8 h-8 grid place-items-center text-gray-500">
                  <span class="i-lucide-ellipsis-vertical"></span>
                </div>
              </template>
            </ClientOnly>
          </template>

          <template #name-cell="{ cell, row }">
            <div class="flex items-center gap-3">
              <div class="w-3.5 h-3.5 rounded-full border border-gray-200 dark:border-gray-700" :style="{ backgroundColor: row.color }"></div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{{ cell.getValue() }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ row.slug }}</p>
              </div>
            </div>
          </template>

          <template #usage_count-cell="{ cell }">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="Number(cell.getValue()) > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'">
              {{ Number(cell.getValue()).toLocaleString() }}
            </span>
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
            <div class="text-sm text-gray-600 dark:text-gray-300">
              Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} to
              {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of
              {{ pagination.total }} results
            </div>

            <div class="flex items-center gap-2">
              <NButton @click="handlePageChange(pagination.page - 1)" :disabled="!pagination.hasPrev" btn="soft-gray" size="sm">
                <span class="i-ph-caret-left"></span>
              </NButton>

              <span class="text-sm text-gray-600 px-3">
                Page {{ pagination.page }} of {{ pagination.totalPages }}
              </span>

              <NButton @click="handlePageChange(pagination.page + 1)" :disabled="!pagination.hasNext" btn="soft-gray" size="sm">
                <span class="i-ph-caret-right"></span>
              </NButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <NDialog v-model:open="showCreateModal" :title="editingTag ? 'Edit Tag' : 'Create Tag'">
      <div class="space-y-4 p-2">
        <NFormGroup label="Name" required>
          <NInput v-model="tagForm.name" placeholder="Enter tag name" />
        </NFormGroup>
        <NFormGroup label="Description">
          <NInput type="textarea" v-model="tagForm.description" placeholder="Optional description" />
        </NFormGroup>
        <NFormGroup label="Color">
          <NInput v-model="tagForm.color" type="color" />
        </NFormGroup>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton btn="soft-gray" @click="showCreateModal = false">Cancel</NButton>
          <NButton btn="soft-blue" :loading="isSubmitting" @click="submitTag">{{ editingTag ? 'Update' : 'Create' }}</NButton>
        </div>
      </template>
    </NDialog>

    <!-- Delete Confirmation Modal -->
    <NDialog v-model:open="showDeleteModal" title="Delete Tag">
      <div class="p-2">
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete the tag "{{ tagToDelete?.name }}"?
          <span v-if="tagToDelete && tagToDelete?.usage_count > 0" class="text-red-600 dark:text-red-400">
            This tag is used by {{ tagToDelete.usage_count }} image(s).
          </span>
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton btn="soft-gray" @click="showDeleteModal = false">Cancel</NButton>
          <NButton color="red" :loading="isDeleting" @click="confirmDelete">Delete</NButton>
        </div>
      </template>
    </NDialog>

    <NDialog v-model:open="isBulkColorOpen" title="Set Tags Color">
      <div class="p-2 space-y-3">
        <NFormGroup label="Color">
          <NInput v-model="bulkColor" type="color" />
        </NFormGroup>
        <p class="text-xs text-gray-500 dark:text-gray-400">This will update the color of {{ selectedTags.length }} selected tag(s).</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton btn="soft-gray" @click="isBulkColorOpen = false">Cancel</NButton>
          <NButton btn="soft-blue" @click="applyBulkColor">Apply</NButton>
        </div>
      </template>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
import type { Tag, TagSearchResponse, TagCreateRequest } from '~~/shared/types/tag'
import type { Pagination } from '~~/shared/types/pagination'
import type { RowSelectionState } from '@tanstack/vue-table'

const { loggedIn, user } = useUserSession()
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
const rowSelection = ref<RowSelectionState>({})

const tagForm = ref<TagCreateRequest>({
  name: '',
  description: '',
  color: '#3B82F6'
})

// Options
const sortLabels = ['Usage Count', 'Name', 'Created Date']
const sortLabelToKey: Record<string, string> = {
  'Usage Count': 'usage_count',
  'Name': 'name',
  'Created Date': 'created_at'
}

const unaColumns = [
  { id: 'row_actions', header: '', enableSorting: false },
  { accessorKey: 'name', header: 'Tag', enableSorting: true },
  { accessorKey: 'usage_count', header: 'Usage', enableSorting: true },
  { accessorKey: 'created_at', header: 'Created', enableSorting: true },
]

const selectedTags = computed(() => {
  const selected = new Set(
    Object.entries(rowSelection.value)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
  )
  return tags.value.filter(t => selected.has(String(t.id)))
})

// Methods
const fetchTags = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return

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
    const total = response.total
    const totalPages = response.pagination.total_pages
    const page = response.pagination.page
    const limit = response.pagination.limit
    pagination.value = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    toast({ title: 'Error', description: 'Failed to fetch tags.', toast: 'soft-error' })
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

const handleSearch = (term?: string) => {
  searchQuery.value = term ?? searchQuery.value
  pagination.value.page = 1
  fetchTags()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchTags()
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
      await $fetch(`/api/tags/${editingTag.value.id}`, {
        method: 'PATCH',
        body: tagForm.value
      })
    } else {
      await $fetch('/api/tags', {
        method: 'POST',
        body: tagForm.value
      })
    }
    
    showCreateModal.value = false
    resetForm()
    await fetchTags()
  } catch (error) {
    console.error('Failed to save tag:', error)
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
  } finally {
    isDeleting.value = false
  }
}

const handleBulkDelete = async () => {
  if (selectedTags.value.length === 0) return
  const confirmed = window.confirm(`Delete ${selectedTags.value.length} selected tag${selectedTags.value.length > 1 ? 's' : ''}?`)
  if (!confirmed) return
  for (const t of selectedTags.value) {
    try {
      await $fetch(`/api/tags/${t.id}`, { method: 'DELETE', query: { force: (t as any).usage_count > 0 ? 'true' : 'false' } })
      delete (rowSelection.value as any)[String(t.id)]
    } catch (e) {
      console.error('Failed to delete tag', t.id)
    }
  }
  await fetchTags()
}

const onRowClick = (event: Event, row: Tag) => {
  const target = event.target as HTMLElement
  if (target.closest('button') || target.closest('a') || target.closest('input')) return
  editTag(row)
}

// Bulk color dialog
const isBulkColorOpen = ref(false)
const bulkColor = ref('#3B82F6')
const openBulkColorDialog = () => { isBulkColorOpen.value = true }
const applyBulkColor = async () => {
  const rows = selectedTags.value
  let success = 0
  for (const t of rows) {
    try { await $fetch(`/api/tags/${t.id}`, { method: 'PATCH', body: { color: bulkColor.value } }); success += 1 } catch {}
  }
  isBulkColorOpen.value = false
  toast({ title: 'Updated', description: `Updated color for ${success} tag(s).`, toast: 'soft-success' })
  fetchTags()
}

const resetForm = () => {
  editingTag.value = null
  tagForm.value = {
    name: '',
    description: '',
    color: '#3B82F6'
  }
}

const tagRowMenuItems = (row: Tag) => [
  { label: 'Edit', onClick: () => editTag(row) },
  { label: 'Delete', onClick: () => deleteTag(row) }
]

// Lifecycle
onMounted(() => {
  if (loggedIn.value && user.value?.role === 'admin') {
    fetchTags()
  }
})

watch([loggedIn, () => user.value?.role], ([newLoggedIn, newRole]) => {
  if (newLoggedIn && newRole === 'admin') {
    fetchTags()
  }
})

watch(() => showCreateModal.value, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})
</script>
