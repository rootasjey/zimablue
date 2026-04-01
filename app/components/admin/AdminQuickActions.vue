<template>
  <div ref="rootRef" class="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
    <!-- Action items (shown when open) -->
    <Transition name="fab-actions">
      <div v-if="isOpen" class="flex flex-col items-end gap-2 mb-1">
        <div
          v-for="(action, i) in actions"
          :key="action.id"
          class="flex items-center gap-3 group"
          :style="{ transitionDelay: `${i * 40}ms` }"
        >
          <!-- Label tooltip -->
          <span class="hidden sm:block px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {{ action.label }}
          </span>

          <!-- Action button -->
          <NuxtLink
            v-if="action.href"
            :to="action.href"
            :class="['w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95', action.colorClass]"
            @click="close"
          >
            <span :class="[action.icon, 'text-base']"></span>
          </NuxtLink>
          <button
            v-else
            :class="['w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95', action.colorClass]"
            @click="() => { action.handler?.(); close() }"
          >
            <span :class="[action.icon, 'text-base']"></span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Main FAB button -->
    <button
      class="w-12 h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      :class="{ 'rotate-45': isOpen }"
      aria-label="Quick actions"
      @click="toggle"
    >
      <span class="i-ph-plus text-xl transition-transform" :class="{ 'rotate-45': isOpen }"></span>
    </button>
  </div>
</template>

<script lang="ts" setup>
const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const toggle = () => { isOpen.value = !isOpen.value }
const close = () => { isOpen.value = false }

const handleOutsideClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (rootRef.value && !rootRef.value.contains(target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onUnmounted(() => document.removeEventListener('click', handleOutsideClick))

// Close on route change
const route = useRoute()
watch(() => route.path, close)

interface QuickAction {
  id: string
  label: string
  icon: string
  colorClass: string
  href?: string
  handler?: () => void
}

const actions: QuickAction[] = [
  {
    id: 'upload',
    label: 'Upload images',
    icon: 'i-ph-upload-simple',
    href: '/admin/images',
    colorClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60',
  },
  {
    id: 'collection',
    label: 'New collection',
    icon: 'i-ph-folder-plus',
    href: '/admin/collections',
    colorClass: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-900/60',
  },
  {
    id: 'todo',
    label: 'New to-do',
    icon: 'i-ph-plus-square',
    href: '/admin/todos',
    colorClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60',
  },
  {
    id: 'messages',
    label: 'View messages',
    icon: 'i-ph-envelope',
    href: '/admin/messages',
    colorClass: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/60',
  },
]
</script>

<style scoped>
.fab-actions-enter-active { transition: all 0.2s ease }
.fab-actions-leave-active { transition: all 0.15s ease }
.fab-actions-enter-from, .fab-actions-leave-to { opacity: 0; transform: translateY(8px) scale(0.95) }
</style>
