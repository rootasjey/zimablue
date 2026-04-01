<template>
  <div class="admin-card overflow-hidden">
    <div class="flex flex-col gap-4 border-b border-stone-200 px-5 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <h3 class="truncate font-title text-sm font-semibold text-zinc-900 dark:text-zinc-100">{{ title }}</h3>
        <p v-if="description" class="mt-0.5 truncate text-xs text-stone-400 dark:text-zinc-500">{{ description }}</p>
      </div>

      <div class="flex items-center gap-2 sm:flex-shrink-0">
        <label class="relative block">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400 i-ph-magnifying-glass dark:text-zinc-500"></span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search..."
            class="h-8 w-44 rounded-lg border border-stone-200 bg-stone-100 pl-8 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-stone-400 focus:ring-2 focus:ring-amber-500/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            @input="debouncedSearch"
            @keyup.enter="handleSearch"
          >
        </label>

        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
          :disabled="loading"
          title="Refresh"
          @click="emit('refresh')"
        >
          <span class="text-sm i-ph-arrow-clockwise" :class="{ 'animate-spin': loading }"></span>
        </button>
      </div>
    </div>

    <Transition name="slide-down">
      <div
        v-if="selectedRows.length"
        class="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2.5 dark:border-amber-800/30 dark:bg-amber-900/10"
      >
        <span class="text-sm text-amber-600 i-ph-selection-all dark:text-amber-400"></span>
        <span class="text-xs font-medium text-amber-700 dark:text-amber-400">{{ selectedRows.length }} selected</span>

        <div class="ml-1 flex items-center gap-1.5">
          <slot name="bulk-actions" :selected="selectedRows">
            <button
              v-for="action in bulkActions"
              :key="action.id"
              type="button"
              class="h-7 rounded-lg px-3 text-xs font-medium transition-colors"
              :class="bulkActionClass(action.variant)"
              @click="emit('bulk-action', action.id, selectedRows)"
            >
              <span v-if="action.icon" :class="[action.icon, 'mr-1.5']"></span>
              {{ action.label }}
            </button>
          </slot>
        </div>

        <button
          type="button"
          class="ml-auto text-xs text-stone-400 transition-colors hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          @click="clearSelection"
        >
          Clear
        </button>
      </div>
    </Transition>

    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-stone-200 dark:border-zinc-800">
            <th class="w-10 py-3 pl-5 pr-3">
              <input
                ref="selectAllCheckboxRef"
                type="checkbox"
                class="h-4 w-4 cursor-pointer rounded border-stone-300 bg-transparent text-amber-500 focus:ring-amber-500/30 dark:border-zinc-600"
                :checked="allRowsSelected"
                @change="toggleSelectAll"
              >
            </th>
            <th
              v-for="column in columns"
              :key="column.accessorKey"
              class="px-3 py-3 text-left"
            >
              <span class="admin-section-title">{{ column.header }}</span>
            </th>
            <th class="px-3 py-3 pr-5 text-right">
              <span class="admin-section-title">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-stone-100 dark:divide-zinc-800/70">
          <tr v-if="loading">
            <td :colspan="columns.length + 2" class="px-5 py-16 text-center">
              <span class="mx-auto mb-3 block animate-spin text-3xl text-amber-500 i-ph-spinner-gap"></span>
              <p class="text-sm text-stone-400 dark:text-zinc-500">Loading...</p>
            </td>
          </tr>

          <tr v-else-if="!data.length">
            <td :colspan="columns.length + 2" class="px-5 py-16 text-center">
              <span class="mx-auto mb-3 block text-4xl text-stone-300 i-ph-tray dark:text-zinc-600"></span>
              <p class="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Nothing here yet</p>
              <p class="text-xs text-stone-400 dark:text-zinc-500">{{ emptyMessage || 'No records match your search.' }}</p>
            </td>
          </tr>

          <template v-else>
            <tr
              v-for="(row, index) in data"
              :key="getRowKey(row, index)"
              class="group cursor-pointer transition-colors hover:bg-stone-50 dark:hover:bg-zinc-800/50"
              @click="handleRowClick(row, $event)"
            >
              <td class="py-3 pl-5 pr-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 cursor-pointer rounded border-stone-300 bg-transparent text-amber-500 focus:ring-amber-500/30 dark:border-zinc-600"
                  :checked="Boolean(rowSelection[index])"
                  @change="toggleRowSelection(index)"
                  @click.stop
                >
              </td>

              <td
                v-for="column in columns"
                :key="column.accessorKey"
                class="px-3 py-3 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <slot
                  :name="`${column.accessorKey}-cell`"
                  :cell="{ value: getCellValue(row, column.accessorKey) }"
                  :row="row"
                >
                  <span v-if="column.cell">{{ column.cell(getCellValue(row, column.accessorKey), row) }}</span>
                  <span v-else>{{ getCellValue(row, column.accessorKey) }}</span>
                </slot>
              </td>

              <td class="px-3 py-3 pr-5 text-right">
                <slot name="actions" :row="row">
                  <div class="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                      title="Edit"
                      @click.stop="emit('edit', row)"
                    >
                      <span class="text-sm i-ph-pencil-simple"></span>
                    </button>
                    <button
                      type="button"
                      class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                      title="Delete"
                      @click.stop="emit('delete', row)"
                    >
                      <span class="text-sm i-ph-trash-simple"></span>
                    </button>
                  </div>
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div
      v-if="pagination && pagination.totalPages > 1"
      class="flex items-center justify-between gap-4 border-t border-stone-200 px-5 py-3 dark:border-zinc-800"
    >
      <p class="text-xs text-stone-400 dark:text-zinc-500">
        {{ pageStart }}-{{ pageEnd }}
        <span class="text-stone-300 dark:text-zinc-600">/ {{ pagination.total }}</span>
      </p>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          :disabled="!pagination.hasPrev"
          @click="emit('page-change', pagination.page - 1)"
        >
          <span class="text-sm i-ph-caret-left"></span>
        </button>

        <span class="px-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {{ pagination.page }} / {{ pagination.totalPages }}
        </span>

        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          :disabled="!pagination.hasNext"
          @click="emit('page-change', pagination.page + 1)"
        >
          <span class="text-sm i-ph-caret-right"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { AdminBulkAction, AdminTableColumn } from '~~/shared/types/admin'
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
  bulkActions: () => [],
})

const emit = defineEmits<Emits>()

const selectAllCheckboxRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const rowSelection = ref<Record<number, boolean>>({})

const selectedIndexes = computed(() => {
  return Object.keys(rowSelection.value)
    .map(key => Number(key))
    .filter(index => rowSelection.value[index])
})

const selectedRows = computed(() => {
  return selectedIndexes.value
    .map(index => props.data[index])
    .filter(Boolean)
})

const allRowsSelected = computed(() => {
  return props.data.length > 0 && selectedRows.value.length === props.data.length
})

const hasPartialSelection = computed(() => {
  return selectedRows.value.length > 0 && selectedRows.value.length < props.data.length
})

const pageStart = computed(() => {
  if (!props.pagination || props.pagination.total === 0) {
    return 0
  }

  return ((props.pagination.page - 1) * props.pagination.limit) + 1
})

const pageEnd = computed(() => {
  if (!props.pagination || props.pagination.total === 0) {
    return 0
  }

  return Math.min(props.pagination.page * props.pagination.limit, props.pagination.total)
})

const syncSelectAllCheckbox = () => {
  if (!selectAllCheckboxRef.value) {
    return
  }

  selectAllCheckboxRef.value.indeterminate = hasPartialSelection.value
}

const getCellValue = (row: any, accessorKey: string) => {
  return row[accessorKey]
}

const getRowKey = (row: any, index: number) => {
  return row.id ?? index
}

const clearSelection = () => {
  rowSelection.value = {}
}

const bulkActionClass = (variant?: string) => {
  if (variant?.includes('red') || variant === 'red') {
    return 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50'
  }

  if (variant?.includes('blue')) {
    return 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:hover:bg-cyan-900/50'
  }

  return 'bg-stone-200 text-stone-700 hover:bg-stone-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600'
}

let searchTimer: ReturnType<typeof setTimeout> | undefined

const debouncedSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    emit('search', searchQuery.value)
  }, 450)
}

const handleSearch = () => {
  emit('search', searchQuery.value)
}

const toggleRowSelection = (index: number) => {
  if (rowSelection.value[index]) {
    const nextSelection = { ...rowSelection.value }
    delete nextSelection[index]
    rowSelection.value = nextSelection
    return
  }

  rowSelection.value = {
    ...rowSelection.value,
    [index]: true,
  }
}

const toggleSelectAll = () => {
  if (allRowsSelected.value) {
    clearSelection()
    return
  }

  rowSelection.value = props.data.reduce<Record<number, boolean>>((selection, _, index) => {
    selection[index] = true
    return selection
  }, {})
}

const handleRowClick = (row: any, event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.closest('button') || target.closest('input') || target.closest('a')) {
    return
  }

  emit('row-click', row)
}

watch(() => props.data, clearSelection)
watch([allRowsSelected, hasPartialSelection], syncSelectAllCheckbox, { immediate: true })

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
