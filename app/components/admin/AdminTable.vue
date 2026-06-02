<template>
  <div class="relative" :class="{ 'pb-14': selectedRows.length > 0 }">
    <div class="flex flex-col gap-4 border-stone-200 px-5 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <h3 v-if="title" class="truncate font-body text-sm font-semibold text-zinc-900 dark:text-zinc-100">{{ title }}</h3>
        <p v-if="description" class="mt-0.5 truncate text-xs text-stone-400 dark:text-zinc-500">{{ description }}</p>
      </div>

      <div class="flex items-center gap-2 sm:flex-shrink-0">
        <slot name="header-tabs" />
        <label class="relative block">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400 i-ph-magnifying-glass dark:text-zinc-500"></span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search..."
            class="h-8 w-32 rounded-lg border border-stone-200 bg-stone-100 pl-8 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-stone-400 focus:ring-2 focus:ring-amber-500/40 sm:w-44 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            @input="debouncedSearch"
            @keyup.enter="handleSearch"
          >
        </label>

        <button
          type="button"
          class="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-stone-200 bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
          :disabled="loading"
          title="Refresh"
          @click="emit('refresh')"
        >
          <span class="text-sm i-ph-arrow-clockwise" :class="{ 'animate-spin': loading }"></span>
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full border-separate border-spacing-0">
        <thead>
          <tr class="text-xs uppercase text-stone-400 dark:text-zinc-500">
            <th class="w-10 rounded-l-[12px] bg-[#F7F7F7] py-3 pl-5 pr-3 dark:bg-zinc-800/50">
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
              class="bg-[#F7F7F7] px-3 py-3 text-left dark:bg-zinc-800/50"
              :class="column.hideOnMobile ? 'hidden md:table-cell' : ''"
            >
              <slot :name="`${column.accessorKey}-header`" :column="column">
                <span class="admin-section-title">{{ column.header }}</span>
              </slot>
            </th>
            <th class="rounded-r-[12px] bg-[#F7F7F7] px-3 py-3 pr-5 text-right dark:bg-zinc-800/50">
              <slot name="actions-header">
                <span class="admin-section-title">Actions</span>
              </slot>
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
              :draggable="isDraggableRow(row, index)"
              :class="[
                'group transition-colors hover:bg-stone-50 dark:hover:bg-zinc-800/50',
                {
                  'cursor-pointer': !isDraggableRow(row, index),
                  'cursor-grab active:cursor-grabbing select-none': isDraggableRow(row, index),
                  'opacity-40': dragIndex === index,
                  'ring-2 ring-amber-400/60 ring-inset': dropIndex === index && dragIndex !== null && dragIndex !== index,
                  'grabbing': isDraggableRow(row, index) && dragIndex !== null,
                  'bg-rose-50/80 dark:bg-rose-900/20 ring-1 ring-inset ring-rose-300/60 dark:ring-rose-700/40': rowSelection[index] && !(keyboardNav && highlightedIndex === index),
                  'ring-1 ring-inset ring-amber-400/40 bg-amber-50/50 dark:bg-amber-900/10': keyboardNav && highlightedIndex === index,
                }
              ]"
              :data-highlighted-index="keyboardNav ? index : undefined"
              @click="handleRowClick(row, $event)"
              @dragstart="handleDragStart(index, $event)"
              @dragend="handleDragEnd"
              @dragover="handleDragOver($event)"
              @dragenter="handleDragEnter(index, $event)"
              @dragleave="handleDragLeave($event)"
              @drop="handleDrop(index, $event)"
            >
              <td class="py-3 pl-5 pr-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 cursor-pointer rounded border-stone-300 bg-transparent text-amber-500 focus:ring-amber-500/30 dark:border-zinc-600"
                  :checked="Boolean(rowSelection[index])"
                  @click="handleCheckboxClick(index, $event)"
                >
              </td>

              <td
                v-for="column in columns"
                :key="column.accessorKey"
                class="px-3 py-3 text-sm text-zinc-700 dark:text-zinc-300"
                :class="column.hideOnMobile ? 'hidden md:table-cell' : ''"
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
                  <div class="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 sm:h-7 sm:w-7 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                      title="Edit"
                      @click.stop="emit('edit', row)"
                    >
                      <span class="text-sm i-ph-pencil-simple"></span>
                    </button>
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600 sm:h-7 sm:w-7 dark:text-zinc-500 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
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

    <Transition name="slide-up">
      <div
        v-if="selectedRows.length"
        class="fixed bottom-0 z-50 left-1/2 -translate-x-1/2 w-full max-w-screen-2xl flex items-center gap-2 border-t border-amber-200 bg-amber-50/95 px-5 py-2.5 shadow-lg backdrop-blur-sm dark:border-amber-800/30 dark:bg-amber-900/90 md:px-7"
      >
        <span class="text-sm text-amber-600 i-ph-selection-all dark:text-amber-400"></span>
        <span class="text-xs font-medium text-amber-700 dark:text-amber-400">{{ selectedRows.length }} selected</span>

        <div class="ml-1 flex items-center gap-1.5">
          <slot name="bulk-actions" :selected="selectedRows">
            <button
              v-for="action in bulkActions"
              :key="action.id"
              type="button"
              class="h-9 sm:h-7 rounded-lg px-3 text-xs font-medium transition-colors"
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
          class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 sm:h-7 sm:w-7 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
          class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 sm:h-7 sm:w-7 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
  title?: string
  description?: string
  columns: AdminTableColumn[]
  data: any[]
  loading?: boolean
  pagination?: Pagination
  bulkActions?: AdminBulkAction[]
  emptyMessage?: string
  draggableRows?: boolean
  isRowDraggable?: (row: any, index: number) => boolean
  keyboardNav?: boolean
}

interface Emits {
  (e: 'search', query: string): void
  (e: 'refresh'): void
  (e: 'page-change', page: number): void
  (e: 'bulk-action', actionId: string, selectedRows: any[]): void
  (e: 'edit', row: any): void
  (e: 'delete', row: any): void
  (e: 'row-click', row: any): void
  (e: 'reorder', dragIndex: number, dropIndex: number): void
  (e: 'duplicate', payload: { highlighted: any; selected: any[] }): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  bulkActions: () => [],
  keyboardNav: false,
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

const selectRange = (from: number, to: number) => {
  const lo = Math.min(from, to)
  const hi = Math.max(from, to)
  const next = { ...rowSelection.value }
  for (let i = lo; i <= hi; i++) {
    next[i] = true
  }
  rowSelection.value = next
  highlightedIndex.value = to
  selectionAnchor.value = to
}

const handleCheckboxClick = (index: number, event: MouseEvent) => {
  if (event.shiftKey && props.keyboardNav) {
    const anchor = selectionAnchor.value >= 0 ? selectionAnchor.value : 0
    selectRange(anchor, index)
    const el = event.target as HTMLInputElement
    el.checked = Boolean(rowSelection.value[index])
    return
  }
  if (props.keyboardNav) {
    selectionAnchor.value = index
    highlightedIndex.value = index
  }
  toggleRowSelection(index)
}

const handleRowClick = (row: any, event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.closest('button') || target.closest('input') || target.closest('a')) {
    return
  }

  if (props.keyboardNav) {
    const index = props.data.indexOf(row)
    if (index >= 0) {
      if (event.shiftKey) {
        const anchor = selectionAnchor.value >= 0 ? selectionAnchor.value : 0
        selectRange(anchor, index)
        return
      }
      selectionAnchor.value = index
      highlightedIndex.value = index
    }
  }

  emit('row-click', row)
}

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName === 'TEXTAREA' || target.isContentEditable) return
  if (target.tagName === 'INPUT' && !['checkbox', 'radio'].includes((target as HTMLInputElement).type)) return
  if (document.querySelector('[role="dialog"], [aria-modal="true"]')) return

  const hasHighlighted = highlightedIndex.value >= 0
  const hasSelection = Object.keys(rowSelection.value).length > 0
  const dataLen = props.data.length

  if ((e.key === 'a' || e.key === 'A') && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    toggleSelectAll()
    return
  }

  if (e.key === 'Escape') {
    if (hasSelection) {
      e.preventDefault()
      clearSelection()
      return
    }
    if (hasHighlighted) {
      e.preventDefault()
      highlightedIndex.value = -1
    }
    return
  }

  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    if (dataLen === 0) return
    e.preventDefault()
    highlightedIndex.value = e.key === 'ArrowRight' ? 0 : dataLen - 1
    selectionAnchor.value = highlightedIndex.value
    return
  }

  if (e.key === 'ArrowUp') {
    if (hasHighlighted && highlightedIndex.value > 0) {
      e.preventDefault()
      if (e.shiftKey) toggleRowSelection(highlightedIndex.value)
      highlightedIndex.value--
      selectionAnchor.value = highlightedIndex.value
    }
    return
  }

  if (e.key === 'ArrowDown') {
    if (hasHighlighted && highlightedIndex.value < dataLen - 1) {
      e.preventDefault()
      if (e.shiftKey) toggleRowSelection(highlightedIndex.value)
      highlightedIndex.value++
      selectionAnchor.value = highlightedIndex.value
    }
    return
  }

  const handleDeleteAction = () => {
    e.preventDefault()
    if (hasSelection) {
      emit('bulk-action', 'delete_selected', selectedRows.value)
    } else if (hasHighlighted) {
      const row = props.data[highlightedIndex.value]
      if (row) emit('delete', row)
    }
  }

  if (e.key === 'Backspace') {
    handleDeleteAction()
    return
  }

  if (e.key === 't' || e.key === 'T') {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    handleDeleteAction()
    return
  }

  if (!hasHighlighted) return

  const highlightedRow = props.data[highlightedIndex.value]
  if (!highlightedRow) return

  if (e.key === ' ') {
    e.preventDefault()
    toggleRowSelection(highlightedIndex.value)
    return
  }

  if (e.key === 'e' || e.key === 'E') {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    e.preventDefault()
    emit('edit', highlightedRow)
    return
  }

  if (e.key === 'd' || e.key === 'D') {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    e.preventDefault()
    emit('duplicate', { highlighted: highlightedRow, selected: selectedRows.value })
    return
  }
}

// Drag-and-drop reorder
const dragIndex = ref<number | null>(null)
const dropIndex = ref<number | null>(null)
const highlightedIndex = ref(-1)
const selectionAnchor = ref(-1)

const isDraggableRow = (row: any, index: number) => {
  if (!props.draggableRows) return false
  return props.isRowDraggable ? props.isRowDraggable(row, index) : true
}

const handleDragStart = (index: number, event: DragEvent) => {
  if (!isDraggableRow(props.data[index], index)) return
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

const handleDragEnd = () => {
  dragIndex.value = null
  dropIndex.value = null
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDragEnter = (index: number, event: DragEvent) => {
  event.preventDefault()
  if (dragIndex.value !== null && dragIndex.value !== index && isDraggableRow(props.data[index], index)) {
    dropIndex.value = index
  }
}

const handleDragLeave = (event: DragEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  if (
    event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom
  ) {
    dropIndex.value = null
  }
}

const handleDrop = (index: number, event: DragEvent) => {
  event.preventDefault()
  if (dragIndex.value === null || dragIndex.value === index) return
  emit('reorder', dragIndex.value, index)
  dragIndex.value = null
  dropIndex.value = null
}

watch(() => props.data, () => {
  clearSelection()
  highlightedIndex.value = -1
})

watch(highlightedIndex, (newIndex) => {
  if (!props.keyboardNav || newIndex < 0) return
  nextTick(() => {
    const el = document.querySelector(`[data-highlighted-index="${newIndex}"]`)
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
})

watch([allRowsSelected, hasPartialSelection], syncSelectAllCheckbox, { immediate: true })

onMounted(() => {
  if (props.keyboardNav) {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  if (props.keyboardNav) {
    window.removeEventListener('keydown', handleKeyDown)
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0 !important;
  bottom: -3rem !important;
}
</style>
