<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Tag Management
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Manage tags used throughout the system
      </p>
    </div>

    <!-- Actions Bar -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-4">
        <UInput
          v-model="searchQuery"
          placeholder="Search tags..."
          icon="i-ph-magnifying-glass"
          class="w-64"
          @input="debouncedSearch"
        />
        <USelect
          v-model="sortBy"
          :options="sortOptions"
          @change="fetchTags"
        />
      </div>
      <UButton
        btn="soft-indigo"
        icon
        label="i-ph-plus"
        @click="showCreateModal = true"
      >
        Create Tag
      </UButton>
    </div>

    <!-- Tags Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tag
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Usage Count
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Created
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="isLoading">
              <td colspan="4" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                Loading tags...
              </td>
            </tr>
            <tr v-else-if="tags.length === 0">
              <td colspan="4" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                No tags found
              </td>
            </tr>
            <tr v-else v-for="tag in tags" :key="tag.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div 
                    class="w-4 h-4 rounded-full mr-3"
                    :style="{ backgroundColor: tag.color }"
                  ></div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ tag.name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ tag.slug }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="tag.usage_count > 0 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'">
                  {{ tag.usage_count }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(tag.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end gap-2">
                  <UButton
                    size="sm"
                    variant="ghost"
                    icon
                    label="i-ph-pencil"
                    @click="editTag(tag)"
                  />
                  <UButton
                    size="sm"
                    variant="ghost"
                    color="red"
                    icon
                    label="i-ph-trash"
                    @click="deleteTag(tag)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total_pages > 1" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} to 
            {{ Math.min(pagination.page * pagination.limit, totalTags) }} of {{ totalTags }} tags
          </div>
          <div class="flex gap-2">
            <UButton
              size="sm"
              variant="outline"
              :disabled="pagination.page <= 1"
              @click="changePage(pagination.page - 1)"
            >
              Previous
            </UButton>
            <UButton
              size="sm"
              variant="outline"
              :disabled="pagination.page >= pagination.total_pages"
              @click="changePage(pagination.page + 1)"
            >
              Next
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <UDialog v-model:open="showCreateModal" title="Create Tag">
      <div class="space-y-4">
        <UFormGroup label="Name" required>
          <UInput
            v-model="tagForm.name"
            placeholder="Enter tag name"
          />
        </UFormGroup>
        <UFormGroup label="Description">
          <UTextarea
            v-model="tagForm.description"
            placeholder="Optional description"
          />
        </UFormGroup>
        <UFormGroup label="Color">
          <UInput
            v-model="tagForm.color"
            type="color"
          />
        </UFormGroup>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="showCreateModal = false">
            Cancel
          </UButton>
          <UButton
            :loading="isSubmitting"
            @click="submitTag"
          >
            {{ editingTag ? 'Update' : 'Create' }}
          </UButton>
        </div>
      </template>
    </UDialog>

    <!-- Delete Confirmation Modal -->
    <UDialog v-model:open="showDeleteModal" title="Delete Tag">
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Are you sure you want to delete the tag "{{ tagToDelete?.name }}"?
        <span v-if="tagToDelete && tagToDelete?.usage_count > 0" class="text-red-600 dark:text-red-400">
          This tag is used by {{ tagToDelete.usage_count }} image(s).
        </span>
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="showDeleteModal = false">
            Cancel
          </UButton>
          <UButton
            color="red"
            :loading="isDeleting"
            @click="confirmDelete"
          >
            Delete
          </UButton>
        </div>
      </template>
    </UDialog>
  </div>
</template>

<script setup lang="ts">
import type { Tag, TagSearchResponse, TagCreateRequest } from '~/types/tag'

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
const sortBy = ref('usage_count')
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const editingTag = ref<Tag | null>(null)
const tagToDelete = ref<Tag | null>(null)
const totalTags = ref(0)
const pagination = ref({
  page: 1,
  limit: 20,
  total_pages: 1
})

const tagForm = ref<TagCreateRequest>({
  name: '',
  description: '',
  color: '#3B82F6'
})

// Options
const sortOptions = [
  { label: 'Usage Count', value: 'usage_count' },
  { label: 'Name', value: 'name' },
  { label: 'Created Date', value: 'created_at' }
]

// Methods
const fetchTags = async () => {
  isLoading.value = true
  try {
    const response = await $fetch<TagSearchResponse>('/api/tags', {
      query: {
        query: searchQuery.value,
        sort_by: sortBy.value,
        sort_order: sortBy.value === 'name' ? 'asc' : 'desc',
        limit: pagination.value.limit,
        offset: (pagination.value.page - 1) * pagination.value.limit
      }
    })
    
    tags.value = response.tags
    totalTags.value = response.total
    pagination.value = response.pagination
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  } finally {
    isLoading.value = false
  }
}

const debouncedSearch = useDebounceFn(() => {
  pagination.value.page = 1
  fetchTags()
}, 300)

const changePage = (page: number) => {
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

const resetForm = () => {
  editingTag.value = null
  tagForm.value = {
    name: '',
    description: '',
    color: '#3B82F6'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  fetchTags()
})

watch(() => showCreateModal.value, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})
</script>
