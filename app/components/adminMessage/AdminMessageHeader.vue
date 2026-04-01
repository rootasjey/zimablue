<template>
  <div class="admin-card p-5 sm:p-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-wrap items-center gap-2">
        <span class="admin-badge-stone">{{ totalMessages }} total</span>
        <span class="admin-badge-amber">{{ unreadCount }} unread</span>
        <span v-if="selectedCount > 0" class="admin-badge-cyan">{{ selectedCount }} selected</span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          class="inline-flex h-10 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 text-sm text-zinc-700 transition-colors hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          :class="isLoading ? 'opacity-60' : ''"
          :disabled="isLoading"
          @click="$emit('refresh')"
        >
          <span :class="['i-ph-arrow-clockwise text-base', isLoading ? 'animate-spin' : '']"></span>
          Refresh
        </button>
      </div>
    </div>

    <div class="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
      <label class="flex h-11 items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 dark:border-zinc-800 dark:bg-zinc-900/80">
        <span class="i-ph-magnifying-glass text-stone-400 dark:text-zinc-500"></span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by subject, sender or message"
          class="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-stone-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          @keydown.enter="handleSearch"
          @input="debouncedSearch"
        >
      </label>

      <select
        v-model="readFilterValue"
        class="h-11 rounded-2xl border border-stone-200 bg-white px-3 text-sm text-zinc-700 outline-none transition-colors hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        @change="handleFilterChange"
      >
        <option v-for="option in readFilterOptions" :key="option.label" :value="option.value ?? ''">{{ option.label }}</option>
      </select>

      <button
        class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-colors"
        :class="multiSelectActive
          ? 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300'
          : 'border-stone-200 bg-white text-zinc-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900'"
        @click="$emit('toggle-multiselect')"
      >
        <span class="i-ph-selection-plus text-base"></span>
        {{ multiSelectActive ? 'Multi-select on' : 'Multi-select' }}
      </button>

      <button
        v-if="multiSelectActive"
        class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        @click="$emit('select-all')"
      >
        <span class="i-ph-check-square-offset text-base"></span>
        {{ isAllSelected ? 'Clear all' : 'Select all' }}
      </button>
    </div>

    <div v-if="selectedCount > 0" class="mt-4 flex flex-wrap gap-2 border-t border-dashed border-stone-200 pt-4 dark:border-zinc-800">
      <button class="inline-flex h-10 items-center gap-2 rounded-2xl bg-stone-100 px-3 text-sm text-stone-700 transition-colors hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700" @click="$emit('bulk-action', 'mark_read')">
        <span class="i-ph-check"></span>
        Mark read
      </button>
      <button class="inline-flex h-10 items-center gap-2 rounded-2xl bg-stone-100 px-3 text-sm text-stone-700 transition-colors hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700" @click="$emit('bulk-action', 'mark_unread')">
        <span class="i-ph-circle"></span>
        Mark unread
      </button>
      <button class="inline-flex h-10 items-center gap-2 rounded-2xl bg-rose-50 px-3 text-sm text-rose-700 transition-colors hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60" @click="$emit('bulk-action', 'confirm_delete')">
        <span class="i-ph-trash"></span>
        Delete
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  totalMessages: number
  visibleMessages?: number
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
const isAllSelected = computed(() => (props.visibleMessages ?? 0) > 0 && props.selectedCount === (props.visibleMessages ?? 0))

// Local state
const searchQuery = ref('')
const readFilterValue = ref('')

const readFilterOptions: ReadFilterOption[] = [
  { label: 'All Messages', value: undefined },
  { label: 'Unread Only', value: 'false' },
  { label: 'Read Only', value: 'true' }
]

let searchTimeout: ReturnType<typeof setTimeout>
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 500)
}

const handleSearch = () => {
  emit('search', searchQuery.value)
}

const handleFilterChange = () => {
  const filterValue = readFilterValue.value === '' ? undefined : readFilterValue.value === 'true'
  emit('filter-change', 'read', filterValue)
}
</script>
