<template>
  <div class="bg-[#D1E0E9] dark:bg-gray-800 rounded-2xl border border-[#b7cbd8] dark:border-gray-700 backdrop-blur-sm">
    <!-- Table Header with Actions -->
  <div class="p-6 border-b border-[#b7cbd8] dark:border-gray-700">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-200">{{ title }}</h3>
          <p v-if="description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ description }}</p>
        </div>
        
        <div class="flex items-center gap-3">
          <NInput
            v-model="searchQuery"
            placeholder="Search..."
            @keyup.enter="handleSearch"
            @input="debouncedSearch"
            class="w-64"
          >
            <template #leading>
              <span class="i-ph-magnifying-glass"></span>
            </template>
          </NInput>
          
          <NButton
            @click="$emit('refresh')"
            :loading="loading"
            btn="soft-gray"
            size="sm"
          >
            <span class="i-ph-arrow-clockwise mr-2"></span>
            Refresh
          </NButton>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedRows.length > 0" class="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ selectedRows.length }} selected
        </span>
        <slot name="bulk-actions" :selected="selectedRows">
          <NButton
            v-for="action in bulkActions"
            :key="action.id"
            @click="$emit('bulk-action', action.id, selectedRows)"
            :btn="action.variant || 'soft'"
            size="sm"
          >
            <span v-if="action.icon" :class="[action.icon, 'mr-2']"></span>
            {{ action.label }}
          </NButton>
        </slot>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th v-if="selectedRows.length >= 0" class="w-12 px-6 py-3">
              <input
                type="checkbox"
                :checked="data.length > 0 && selectedRows.length === data.length"
                :indeterminate="selectedRows.length > 0 && selectedRows.length < data.length"
                @change="toggleSelectAll"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </th>
            <th
              v-for="column in columns"
              :key="column.accessorKey"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {{ column.header }}
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-[#D1E0E9] dark:bg-gray-900 divide-y divide-[#b7cbd8] dark:divide-gray-700">
          <tr v-if="loading" class="animate-pulse">
            <td :colspan="columns.length + 2" class="px-6 py-12 text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <p class="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
            </td>
          </tr>
          <tr v-else-if="data.length === 0">
            <td :colspan="columns.length + 2" class="px-6 py-12 text-center">
              <span class="i-ph-database text-4xl text-gray-400 mb-4 block"></span>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2">No data found</h3>
              <p class="text-gray-600 dark:text-gray-400">{{ emptyMessage || 'No records match your search criteria.' }}</p>
            </td>
          </tr>
          <tr
            v-else
            v-for="(row, index) in data"
            :key="row.id || index"
            class="hover:bg-[#c4d5df] dark:hover:bg-gray-800 cursor-pointer"
            @click="handleRowClick(row, $event)"
          >
            <td class="w-12 px-6 py-4">
              <input
                type="checkbox"
                :checked="rowSelection[index]"
                @change="toggleRowSelection(index)"
                @click.stop
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </td>
            <td
              v-for="column in columns"
              :key="column.accessorKey"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200"
            >
              <slot :name="`${column.accessorKey}-cell`" :cell="{ value: row[column.accessorKey] }" :row="row">
                <span v-if="column.cell">{{ column.cell(row[column.accessorKey], row) }}</span>
                <span v-else>{{ row[column.accessorKey] }}</span>
              </slot>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
              <slot name="actions" :row="row">
                <div class="flex items-center gap-2">
                  <NButton
                    @click.stop="$emit('edit', row)"
                    btn="soft-gray"
                    size="xs"
                  >
                    <span class="i-ph-pencil"></span>
                  </NButton>
                  <NButton
                    @click.stop="$emit('delete', row)"
                    btn="soft-red"
                    size="xs"
                  >
                    <span class="i-ph-trash"></span>
                  </NButton>
                </div>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.totalPages > 1" class="p-6 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} to 
          {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of 
          {{ pagination.total }} results
        </div>
        
        <div class="flex items-center gap-2">
          <NButton
            @click="$emit('page-change', pagination.page - 1)"
            :disabled="!pagination.hasPrev"
            btn="soft-gray"
            size="sm"
          >
            <span class="i-ph-caret-left"></span>
          </NButton>
          
          <span class="text-sm text-gray-600 dark:text-gray-400 px-3">
            Page {{ pagination.page }} of {{ pagination.totalPages }}
          </span>
          
          <NButton
            @click="$emit('page-change', pagination.page + 1)"
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
</template>

<script lang="ts" setup>
import type { AdminTableColumn, AdminBulkAction } from '~~/shared/types/admin'
import type { Pagination } from '~~/shared/types/pagination'

interface Props {
  title: string
  description?: string
  columns: AdminTableColumn[]
  data: any[]
  loading?: boolean
  pagination?: Pagination
  bulkActions?: AdminBulkAction[]
  emptyMessage?: string
}

interface Emits {
  (e: 'search', query: string): void
  (e: 'refresh'): void
  (e: 'page-change', page: number): void
  (e: 'bulk-action', actionId: string, selectedRows: any[]): void
  (e: 'edit', row: any): void
  (e: 'delete', row: any): void
  (e: 'row-click', row: any): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  bulkActions: () => []
})

const emit = defineEmits<Emits>()

// Local state
const searchQuery = ref('')
const rowSelection = ref<Record<string, boolean>>({})

// Computed
const selectedRows = computed(() => {
  return Object.keys(rowSelection.value)
    .filter(key => rowSelection.value[key])
    .map(key => props.data[parseInt(key)])
})

// Methods
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

const toggleRowSelection = (index: number) => {
  if (rowSelection.value[index]) {
    delete rowSelection.value[index]
  } else {
    rowSelection.value[index] = true
  }
}

const toggleSelectAll = () => {
  if (selectedRows.value.length === props.data.length) {
    rowSelection.value = {}
  } else {
    rowSelection.value = props.data.reduce((acc, _, index) => {
      acc[index] = true
      return acc
    }, {} as Record<number, boolean>)
  }
}

const handleRowClick = (row: any, event: Event) => {
  // Prevent row selection when clicking on action buttons
  const target = event.target as HTMLElement
  if (target.closest('button') || target.closest('input')) {
    event.stopPropagation()
    return
  }

  emit('row-click', row)
}

// Watch for data changes to clear selection
watch(() => props.data, () => {
  rowSelection.value = {}
})
</script>
