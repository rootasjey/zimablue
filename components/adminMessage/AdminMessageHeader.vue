<template>
  <div class="relative rounded-6 mb-6">
    <!-- Stats Row -->
    <UTooltip>
      <template #default>
        <UButton @click="$emit('refresh')" :loading="isLoading" btn="light:soft-indigo dark:solid-gray" size="xs"
          rounded="6" class="absolute right-4 top-4">
          <span class="i-ph-info mr-2"></span>
          <span class="hidden md:inline">Stats</span>
        </UButton>
      </template>
      <template #content>
        <div class="flex gap-3 items-center px-3 py-1">
          <p>{{ totalMessages }} total messages</p>
          <span>•</span>
          <p>{{ unreadCount }} unread</p>
        </div>
      </template>
    </UTooltip>

    <!-- Bulk Actions Row -->
    <div class="flex flex-wrap gap-4 pt-4 border-t b-dashed border-gray-200 dark:border-gray-700">
      <div>
        <UInput v-model="searchQuery" placeholder="Search messages..." @keyup.enter="handleSearch"
          @input="debouncedSearch" size="sm" rounded=6
          class="shadow-lg border border-white focus:border-blue-500 dark:border-gray-700">
          <template #leading>
            <span class="i-ph-magnifying-glass"></span>
          </template>
        </UInput>
      </div>
      <div>
        <USelect v-model="readFilter" :items="readFilterOptions" @update:model-value="handleFilterChange"
          select="soft-gray" size="xs" placeholder="Filter by status" item-key="label" value-key="label" />
      </div>
      <UTooltip>
        <template #default>
          <UButton @click="$emit('toggle-multiselect')" size="xs" :btn="multiSelectActive ? 'soft-blue' : 'soft-gray'"
            rounded="6">
            <span class="i-ph-list mr-1"></span>
            <span class="hidden md:inline">Multi-select</span>
          </UButton>
        </template>
        <template #content>
          <div class="px-3 py-1">{{ multiSelectActive ? 'Deactivate' : 'Activate' }} multi-select mode</div>
        </template>
      </UTooltip>

      <UTooltip v-if="multiSelectActive">
        <template #default>
          <UButton @click="$emit('select-all')" size="xs" btn="soft-gray" rounded="6">
            <span class="i-ph-check-square-offset mr-1"></span>
            <span class="hidden md:inline">{{ isAllSelected ? 'Deselect all' : 'Select all' }}</span>
          </UButton>
        </template>
        <template #content>
          <div class="px-3 py-1">Toggle select all messages</div>
        </template>
      </UTooltip>

      <div v-if="selectedCount > 0" class="flex flex-wrap gap-2">
        <UTooltip>
          <template #default>
            <UButton @click="$emit('bulk-action', 'mark_read')" size="xs" btn="soft-gray" rounded="6">
              <span class="i-ph-check mr-2"></span>
              <span class="hidden md:inline">Read </span>
              <span>({{ selectedCount }})</span>
            </UButton>
          </template>
          <template #content>
            <div class="px-3 py-1">Mark {{ selectedCount }} selected messages as read</div>
          </template>
        </UTooltip>

        <UTooltip>
          <template #default>
            <UButton @click="$emit('bulk-action', 'mark_unread')" size="xs" btn="soft-gray" rounded="6">
              <span class="i-ph-circle mr-2"></span>
              <span class="hidden md:inline">Unread </span>
              <span>({{ selectedCount }})</span>
            </UButton>
          </template>
          <template #content>
            <div class="px-3 py-1">Mark {{ selectedCount }} selected messages as unread</div>
          </template>
        </UTooltip>

        <UTooltip>
          <template #default>
            <UButton @click="$emit('bulk-action', 'confirm_delete')" size="xs" btn="light:soft-pink dark:outline-pink"
              rounded="6">
              <span class="i-ph-trash mr-2"></span>
              <span class="hidden md:inline">Delete </span>
              <span>({{ selectedCount }})</span>
            </UButton>
          </template>
          <template #content>
            <div class="px-3 py-1">Delete {{ selectedCount }} selected messages</div>
          </template>
        </UTooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  totalMessages: number
  unreadCount: number
  selectedCount: number
  isLoading: boolean
  multiSelectActive: boolean
}

interface ReadFilterOption {
  label: string
  value: string | undefined
}

interface Emits {
  (e: 'refresh'): void
  (e: 'bulk-action', action: 'mark_read' | 'mark_unread' | 'confirm_delete' | 'delete'): void
  (e: 'search', query: string): void
  (e: 'filter-change', filterType: string, value: any): void
  (e: 'toggle-multiselect'): void
  (e: 'select-all'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Determine if all are selected to change button label
const isAllSelected = computed(() => props.totalMessages > 0 && props.selectedCount === props.totalMessages)

// Local state
const searchQuery = ref('')
const readFilter = ref<ReadFilterOption>({ label: 'All Messages', value: undefined })

const readFilterOptions: ReadFilterOption[] = [
  { label: 'All Messages', value: undefined },
  { label: 'Unread Only', value: 'false' },
  { label: 'Read Only', value: 'true' }
]

// Debounced search
let searchTimeout: NodeJS.Timeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 500)
}

const handleSearch = () => {
  emit('search', searchQuery.value)
}

const handleFilterChange = (selectedOption: ReadFilterOption) => {
  readFilter.value = selectedOption
  const filterValue = selectedOption.value === undefined ? undefined : selectedOption.value === 'true'
  emit('filter-change', 'read', filterValue)
}
</script>
