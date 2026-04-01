<template>
  <div>
    <!-- Column headers -->
    <div class="grid gap-4" :style="gridStyle">
      <div
        v-for="col in columns"
        :key="col.id"
        class="min-w-0"
      >
        <!-- Column header -->
        <div class="flex items-center justify-between mb-3 px-1">
          <div class="flex items-center gap-2">
            <div :class="['w-2 h-2 rounded-full', col.dotColor]"></div>
            <span class="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
              {{ col.label }}
            </span>
            <span class="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-xs font-medium text-stone-500 dark:text-zinc-400">
              {{ col.items.length }}
            </span>
          </div>

          <button
            v-if="onAdd"
            class="flex items-center justify-center w-5 h-5 rounded text-stone-400 dark:text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
            :title="`Add to ${col.label}`"
            @click="onAdd(col.id)"
          >
            <span class="i-ph-plus text-xs"></span>
          </button>
        </div>

        <!-- Cards -->
        <div class="flex flex-col gap-2 min-h-[120px]">
          <div
            v-for="item in col.items"
            :key="item.id"
            class="admin-card p-3.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group"
            @click="$emit('item-click', item)"
          >
            <!-- Priority badge -->
            <div class="flex items-start justify-between gap-2 mb-2">
              <span
                :class="['admin-badge text-[10px] leading-none py-1', priorityClass(item.priority)]"
              >
                {{ item.priority }}
              </span>

              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  class="flex items-center justify-center w-5 h-5 rounded text-stone-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  @click.stop="$emit('edit', item)"
                  title="Edit"
                >
                  <span class="i-ph-pencil-simple text-xs"></span>
                </button>
                <button
                  class="flex items-center justify-center w-5 h-5 rounded text-stone-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                  @click.stop="$emit('delete', item)"
                  title="Delete"
                >
                  <span class="i-ph-trash-simple text-xs"></span>
                </button>
              </div>
            </div>

            <!-- Title -->
            <p class="text-sm text-zinc-800 dark:text-zinc-200 font-medium leading-snug line-clamp-2">
              {{ item.title }}
            </p>

            <!-- Description -->
            <p v-if="item.description" class="text-xs text-stone-400 dark:text-zinc-500 mt-1 line-clamp-2">
              {{ item.description }}
            </p>

            <!-- Due date -->
            <div v-if="item.dueDate" class="flex items-center gap-1 mt-2">
              <span class="i-ph-calendar-dots text-stone-300 dark:text-zinc-600 text-xs"></span>
              <span
                :class="['text-[10px] font-medium', isOverdue(item.dueDate) ? 'text-rose-500 dark:text-rose-400' : 'text-stone-400 dark:text-zinc-500']"
              >
                {{ formatDate(item.dueDate) }}
              </span>
            </div>
          </div>

          <!-- Empty column placeholder -->
          <div
            v-if="col.items.length === 0"
            class="flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-stone-200 dark:border-zinc-800 text-stone-300 dark:text-zinc-600"
          >
            <span class="text-xs">Empty</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface KanbanItem {
  id: number | string
  title: string
  description?: string
  priority?: string
  status: string
  dueDate?: string
  [key: string]: any
}

export interface KanbanColumn {
  id: string
  label: string
  dotColor: string
  items: KanbanItem[]
}

interface Props {
  columns: KanbanColumn[]
  onAdd?: (columnId: string) => void
}

defineProps<Props>()

defineEmits<{
  (e: 'item-click', item: KanbanItem): void
  (e: 'edit', item: KanbanItem): void
  (e: 'delete', item: KanbanItem): void
}>()

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(3, minmax(0, 1fr))`,
}))

const priorityClass = (priority?: string) => {
  if (!priority) return 'admin-badge-stone'
  const p = priority.toLowerCase()
  if (p === 'high') return 'admin-badge-rose'
  if (p === 'medium') return 'admin-badge-amber'
  return 'admin-badge-cyan'
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

const isOverdue = (iso: string) => new Date(iso) < new Date() && new Date(iso).toDateString() !== new Date().toDateString()
</script>
