<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999]"
        @click="emit('close')"
        @contextmenu.prevent="emit('close')"
      >
        <div
          ref="menuRef"
          :style="{ left: `${x}px`, top: `${y}px` }"
          class="absolute w-52 overflow-hidden rounded-md border border-base bg-popover p-1 text-popover shadow-md"
          @click.stop
        >
          <template v-for="(item, idx) in displayItems" :key="idx">
            <div v-if="item.type === 'separator'" class="h-px bg-border -mx-1 my-1" />
            <button
              v-else
              class="w-full text-left transition-color select-none rounded-sm px-2.5 py-2 text-xs focus-visible:outline-none hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              :class="{
                'opacity-40 cursor-default pointer-events-none': item.disabled,
                'pl-7': item.indent,
              }"
              @click="handleItemClick(item)"
            >
              {{ item.label }}
            </button>
          </template>

          <div class="h-px bg-border -mx-1 my-1" />

          <button
            class="w-full text-left transition-color select-none rounded-sm px-2.5 py-2 text-xs focus-visible:outline-none flex items-center gap-1.5 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            @click="handleNativeMenu"
          >
            <span class="i-ph-arrow-square-out text-xs flex-shrink-0" />
            <span class="text-gray-500 dark:text-gray-400">Native browser menu</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
interface FlattenedItem {
  type?: 'separator' | 'item'
  label?: string
  onClick?: () => void
  disabled?: boolean
  indent?: boolean
}

interface Props {
  isOpen: boolean
  x: number
  y: number
  items: any[]
}

const emit = defineEmits<{
  close: []
  showNative: []
}>()

const props = defineProps<Props>()

const menuRef = ref<HTMLElement | null>(null)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

const displayItems = computed<FlattenedItem[]>(() => {
  const result: FlattenedItem[] = []
  for (const item of props.items) {
    if (!item || (typeof item === 'object' && (Object.keys(item).length === 0 || item.type === 'separator'))) {
      result.push({ type: 'separator' })
    } else if ('items' in item && Array.isArray(item.items) && item.items.length) {
      result.push({ label: item.label, disabled: true })
      for (const sub of item.items) {
        result.push({ label: sub.label, onClick: sub.onClick, indent: true })
      }
    } else if (item.label) {
      result.push({ label: item.label, onClick: item.onClick })
    }
  }
  return result
})

function handleItemClick(item: FlattenedItem) {
  if (item.disabled || !item.onClick) return
  item.onClick()
  emit('close')
}

function handleNativeMenu() {
  emit('showNative')
  emit('close')
}
</script>

<style scoped>
.context-menu-enter-active {
  transition: opacity 100ms ease-out, transform 100ms ease-out;
}
.context-menu-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.context-menu-leave-active {
  transition: opacity 75ms ease-in;
}
.context-menu-leave-to {
  opacity: 0;
}
</style>
