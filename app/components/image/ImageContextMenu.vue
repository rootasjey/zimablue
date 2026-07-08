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
          class="absolute w-52 overflow-visible rounded-md border border-base bg-popover p-1 text-popover shadow-md"
          @click.stop
        >
          <template v-for="(item, idx) in items" :key="idx">
            <div v-if="isSeparator(item)" class="h-px bg-border -mx-1 my-1" />
            <div
              v-else
              class="relative"
              @mouseenter="openSubMenu(idx)"
              @mouseleave="scheduleCloseSubMenu"
            >
              <button
                class="w-full text-left transition-color select-none rounded-sm px-2.5 py-2 text-xs focus-visible:outline-none flex items-center gap-1.5 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                :class="{ 'opacity-40 cursor-default pointer-events-none': item.disabled }"
                @click="handleItemClick(item)"
              >
                <span class="flex-1 truncate">{{ item.label }}</span>
                <span v-if="hasSubItems(item)" class="i-ph-caret-right text-xs flex-shrink-0 opacity-50" />
              </button>
              <Transition name="context-sub-menu">
                <div
                  v-if="hasSubItems(item) && activeSubMenu === idx"
                  :ref="(el) => registerSubMenuRef(idx, el)"
                  class="absolute top-0 w-52 rounded-md border border-base bg-popover p-1 text-popover shadow-md"
                  :style="subMenuPosition(idx)"
                  @click.stop
                >
                <template v-for="(subItem, subIdx) in item.items" :key="subIdx">
                  <div v-if="isSeparator(subItem)" class="h-px bg-border -mx-1 my-1" />
                  <button
                    v-else
                    class="w-full text-left transition-color select-none rounded-sm px-2.5 py-2 text-xs focus-visible:outline-none flex items-center gap-1.5 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                    :class="{ 'opacity-40 cursor-default pointer-events-none': subItem.disabled }"
                    @click="handleItemClick(subItem)"
                  >
                    <span class="flex-1 truncate">{{ subItem.label }}</span>
                  </button>
                </template>
              </div>
            </Transition>
            </div>
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

<script setup lang="ts">
interface ContextMenuItem {
  label?: string
  type?: 'separator'
  onClick?: () => void
  disabled?: boolean
  items?: ContextMenuItem[]
}

interface Props {
  isOpen: boolean
  x: number
  y: number
  items: ContextMenuItem[]
}

const emit = defineEmits<{
  close: []
  showNative: []
}>()

const props = defineProps<Props>()

const menuRef = ref<HTMLElement | null>(null)
const activeSubMenu = ref<number | null>(null)
const subMenuEls = ref<Map<number, HTMLElement>>(new Map())
let closeTimer: ReturnType<typeof setTimeout> | null = null

function isSeparator(item: ContextMenuItem | undefined | null): boolean {
  if (!item) return true
  if (typeof item === 'object' && (Object.keys(item).length === 0 || item.type === 'separator')) return true
  return false
}

function hasSubItems(item: ContextMenuItem): boolean {
  return !!item.items && item.items.length > 0 && !item.disabled
}

function registerSubMenuRef(idx: number, el: unknown) {
  if (el) {
    subMenuEls.value.set(idx, el as HTMLElement)
  } else {
    subMenuEls.value.delete(idx)
  }
}

function subMenuPosition(idx: number): Record<string, string> {
  const style: Record<string, string> = { left: '100%' }
  if (isRightOverflow(idx)) {
    style.left = 'auto'
    style.right = '100%'
  }
  return style
}

function isRightOverflow(idx: number): boolean {
  const el = subMenuEls.value.get(idx)
  if (!el) return false
  const rect = el.getBoundingClientRect()
  return rect.right > window.innerWidth
}

function openSubMenu(idx: number) {
  cancelCloseSubMenu()
  activeSubMenu.value = idx
  nextTick(() => {
    const el = subMenuEls.value.get(idx)
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.bottom > window.innerHeight) {
      el.style.top = 'auto'
      el.style.bottom = '0'
    }
    if (rect.right > window.innerWidth) {
      el.style.left = 'auto'
      el.style.right = '100%'
    }
  })
}

function scheduleCloseSubMenu() {
  closeTimer = setTimeout(() => {
    activeSubMenu.value = null
  }, 150)
}

function cancelCloseSubMenu() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function handleItemClick(item: ContextMenuItem) {
  if (item.disabled || isSeparator(item) || hasSubItems(item)) return
  item.onClick?.()
  emit('close')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (activeSubMenu.value !== null) {
      activeSubMenu.value = null
    } else {
      emit('close')
    }
  }
}

function handleNativeMenu() {
  emit('showNative')
  emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (closeTimer) clearTimeout(closeTimer)
})
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

.context-sub-menu-enter-active {
  transition: opacity 100ms ease-out, transform 100ms ease-out;
}
.context-sub-menu-enter-from {
  opacity: 0;
  transform: scale(0.95) translateX(-2px);
}
.context-sub-menu-leave-active {
  transition: opacity 75ms ease-in;
}
.context-sub-menu-leave-to {
  opacity: 0;
}
</style>
