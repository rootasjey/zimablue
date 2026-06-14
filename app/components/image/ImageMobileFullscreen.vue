<template>
  <Teleport to="body">
    <div v-if="isOpen || isFlying" class="fixed inset-0 z-50 bg-black/95 sm:hidden" />

    <div
      v-if="(isFlying || isOpen) && image && flyRect"
      class="fixed z-50 sm:hidden overflow-hidden"
      :style="{
        top: flyRect.top + 'px',
        left: flyRect.left + 'px',
        width: flyRect.width + 'px',
        height: flyRect.height + 'px',
        transform: flyTransform,
        transition: hasTransition ? 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        willChange: 'transform',
      }"
      @transitionend="onFlyEnd"
    >
      <NuxtImg
        :src="getImageSrc(image, 'fullscreen').src"
        :provider="getImageSrc(image, 'fullscreen').provider"
        :modifiers="getImageSrc(image, 'fullscreen').modifiers"
        :alt="image.name || 'Image'"
        class="w-full h-full object-cover select-none"
        draggable="false"
        loading="eager"
      />
    </div>

    <Transition name="ui-fade">
      <div
        v-if="isOpen && !isFlying && !isClosing"
        class="fixed inset-0 z-[51] sm:hidden"
        @touchstart.passive="handleTouchStart"
        @touchmove.passive="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <button
          class="absolute top-4 right-4 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 active:scale-90 transition-all duration-200"
          aria-label="Close"
          @click="handleClose"
        >
          <span class="i-ph-x text-xl" />
        </button>

        <button
          v-if="canGoPrev"
          class="absolute left-0 top-0 bottom-40 w-1/3 z-20 flex items-center justify-start"
          aria-label="Previous image"
          @click="handlePrev"
        >
          <div class="ml-3 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white opacity-0 active:opacity-100 transition-opacity">
            <span class="i-ph-caret-left text-xl" />
          </div>
        </button>

        <button
          v-if="canGoNext"
          class="absolute right-0 top-0 bottom-40 w-1/3 z-20 flex items-center justify-end"
          aria-label="Next image"
          @click="handleNext"
        >
          <div class="mr-3 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white opacity-0 active:opacity-100 transition-opacity">
            <span class="i-ph-caret-right text-xl" />
          </div>
        </button>

        <div v-if="image" class="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

          <div class="relative px-4 pt-10 pb-6 pointer-events-auto">
            <h2 class="font-title font-700 text-lg text-white truncate">{{ image.name || 'Untitled' }}</h2>

            <p v-if="image.description" class="mt-1 text-sm text-white/70 line-clamp-2">{{ image.description }}</p>

            <div v-if="displayTags.length" class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="tag in displayTags"
                :key="tag.name"
                :style="getTagBadgeStyles(tag.color)"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-[var(--tag-bg)] text-[var(--tag-text)] dark:bg-[var(--tag-bg-dark)] dark:text-[var(--tag-text-dark)]"
              >
                {{ tag.name }}
              </span>
            </div>

            <div class="flex items-center gap-4 mt-2 text-xs text-white/50">
              <span class="flex items-center gap-1"><span class="i-ph-eye text-sm" />{{ image.stats_views ?? 0 }}</span>
              <span class="flex items-center gap-1"><span class="i-ph-download-simple text-sm" />{{ image.stats_downloads ?? 0 }}</span>
              <span class="flex-1" />
              <span class="text-white/30">{{ currentPosition }} / {{ totalImages }}</span>
            </div>

            <div class="flex items-center gap-2 mt-3">
              <button
                class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white text-sm font-500 active:scale-95 transition-all pointer-events-auto"
                @click="handleDownload"
              >
                <span class="i-ph-download-simple text-base" />Download
              </button>
              <button
                class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white text-sm font-500 active:scale-95 transition-all pointer-events-auto"
                @click="$emit('fullPage')"
              >
                <span class="i-ph-arrow-square-out text-base" />Full page
              </button>
              <ClientOnly>
                <NDropdownMenu
                  v-if="image && imageMenuItems"
                  :items="wrappedMenuItems"
                  size="sm"
                  menu-label=""
                  :_dropdown-menu-content="{ class: 'w-52', align: 'end', side: 'top' }"
                >
                  <button class="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-md text-white active:scale-95 transition-all pointer-events-auto">
                    <span class="i-ph-dots-three-vertical text-lg" />
                  </button>
                </NDropdownMenu>
                <template #fallback>
                  <button class="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-md text-white active:scale-95 transition-all pointer-events-auto opacity-50">
                    <span class="i-ph-dots-three-vertical text-lg" />
                  </button>
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import type { Image } from '~~/shared/types/image'
import { useImageActions } from '~/composables/image/useImageActions'
import { useImageSrc } from '~/composables/image/useImageSrc'
import { useTagColor } from '~/composables/useTagColor'
import { useImageModal } from '~/composables/image/useImageModal'
const { getSrc: getImageSrc } = useImageSrc()
const imageModal = useImageModal()

interface Props {
  isOpen: boolean
  image: Image | null
  prevImage: Image | null
  nextImage: Image | null
  currentPosition: number
  totalImages: number
  canGoPrev: boolean
  canGoNext: boolean
  sourceRect: DOMRect | null
  imageMenuItems?: (image: Image) => ({} | { label: string; onClick?: () => void })[]
}

interface Emits {
  close: []
  prev: []
  next: []
  fullPage: []
  openEditDrawer: [image: Image]
  openAddToCollectionDrawer: [image: Image]
  replaceImage: [image: Image]
  requestDelete: [image: Image]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { downloadImage, normalizeTags } = useImageActions()
const { getTagBadgeStyles } = useTagColor()
const displayTags = computed(() => normalizeTags(props.image?.tags))

const isFlying = ref(false)
const isClosing = ref(false)
const hasTransition = ref(false)
const flyRect = ref<DOMRect | null>(null)
const flyTransform = ref('')

const handleDownload = () => {
  if (!props.image) return
  downloadImage(props.image)
}

// --- FLIP: Enter ---
watch(() => props.isOpen, (open) => {
  if (!open) return
  isClosing.value = false
  const rect = imageModal.sourceRect.value
  if (rect && props.image) {
    startEnterFly(rect)
  }
})

function startEnterFly(src: DOMRect) {
  const vw = window.innerWidth
  const vh = window.innerHeight

  flyRect.value = new DOMRect(src.left, src.top, src.width, src.height)
  flyTransform.value = 'none'
  hasTransition.value = false
  isFlying.value = true

  const s = Math.min(vw / src.width, vh / src.height)
  const tx = (-src.left + (vw - src.width) / 2) / s
  const ty = (-src.top + (vh - src.height) / 2) / s

  nextTick(() => {
    requestAnimationFrame(() => {
      hasTransition.value = true
      flyTransform.value = `scale(${s}) translate3d(${tx}px, ${ty}px, 0)`
    })
  })
}

function onFlyEnd(e: TransitionEvent) {
  if (e.propertyName !== 'transform') return
  if (isClosing.value) {
    isClosing.value = false
    isFlying.value = false
    flyRect.value = null
    flyTransform.value = ''
    hasTransition.value = false
    emit('close')
  } else {
    isFlying.value = false
    hasTransition.value = false
  }
}

// --- FLIP: Leave ---
function handleClose() {
  if (!props.image) { emit('close'); return }

  const src = imageModal.sourceRect.value
  if (!src) { emit('close'); return }

  isClosing.value = true
  const vw = window.innerWidth
  const vh = window.innerHeight
  const s = Math.min(vw / src.width, vh / src.height)
  const tx = (-src.left + (vw - src.width) / 2) / s
  const ty = (-src.top + (vh - src.height) / 2) / s

  flyRect.value = new DOMRect(src.left, src.top, src.width, src.height)
  flyTransform.value = `scale(${s}) translate3d(${tx}px, ${ty}px, 0)`
  hasTransition.value = false
  isFlying.value = true

  nextTick(() => {
    requestAnimationFrame(() => {
      hasTransition.value = true
      flyTransform.value = 'none'
    })
  })
}

const handlePrev = () => { if (props.canGoPrev) emit('prev') }
const handleNext = () => { if (props.canGoNext) emit('next') }

// Swipe
const swipeStartX = ref(0)
const swipeStartY = ref(0)
const isSwiping = ref(false)
const SWIPE_THRESHOLD = 60

const handleTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0]
  if (!touch) return
  swipeStartX.value = touch.clientX
  swipeStartY.value = touch.clientY
  isSwiping.value = true
}

const handleTouchMove = () => {}

const handleTouchEnd = (e: TouchEvent) => {
  if (!isSwiping.value) return
  isSwiping.value = false
  const touch = e.changedTouches[0]
  if (!touch) return
  const dx = touch.clientX - swipeStartX.value
  const dy = touch.clientY - swipeStartY.value

  if (Math.abs(dy) > Math.abs(dx) && dy > SWIPE_THRESHOLD) { handleClose(); return }
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
    if (dx > 0) { if (props.canGoPrev) emit('prev') } else { if (props.canGoNext) emit('next') }
  }
}

// Keyboard
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isOpen) return
  const t = event.target as HTMLElement | null
  if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable) return

  switch (event.key) {
    case 'Escape': event.preventDefault(); handleClose(); break
    case 'ArrowLeft': event.preventDefault(); if (props.canGoPrev) emit('prev'); break
    case 'ArrowRight': event.preventDefault(); if (props.canGoNext) emit('next'); break
  }
  if (!props.image) return
  switch (event.key.toLowerCase()) {
    case 'f': event.preventDefault(); emit('fullPage'); break
    case 'd': event.preventDefault(); handleDownload(); break
  }
}

watch(() => props.isOpen, (open) => {
  if (!import.meta.client) return
  if (open) window.addEventListener('keydown', handleKeydown)
  else window.removeEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (import.meta.client) window.removeEventListener('keydown', handleKeydown)
})

const wrappedMenuItems = computed(() => {
  if (!props.imageMenuItems || !props.image) return []
  return props.imageMenuItems(props.image).map(item => {
    if (!item || typeof item !== 'object' || !('label' in item)) return item
    if (item.label === 'Edit') return { ...item, onClick: () => nextTick(() => emit('openEditDrawer', props.image!)) }
    if (item.label === 'Add to collection') return { ...item, onClick: () => nextTick(() => emit('openAddToCollectionDrawer', props.image!)) }
    return item
  })
})
</script>

<style scoped>
.ui-fade-enter-active { transition: opacity 0.2s ease-out 0.15s; }
.ui-fade-leave-active { transition: opacity 0.1s ease-in; }
.ui-fade-enter-from, .ui-fade-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .ui-fade-enter-active, .ui-fade-leave-active { transition: none; }
}
</style>
