<template>
  <Teleport to="body">
    <div v-if="isOpen || isFlying" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm sm:hidden" />

    <div
      v-if="(isFlying || isOpen) && image && cardRect"
      class="fixed z-[51] sm:hidden rounded-3xl shadow-2xl bg-white dark:bg-gray-900 flex flex-col overflow-hidden"
      :style="{
        top: cardRect.top + 'px',
        left: cardRect.left + 'px',
        width: cardRect.width + 'px',
        height: cardRect.height + 'px',
        transform: flyTransform,
        transition: hasTransition ? 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), width 0s, height 0s' : 'none',
        willChange: 'transform',
      }"
      @transitionend="onFlyEnd"
      @click.stop
    >
      <!-- Close button -->
      <button
        v-if="!isFlying"
        class="absolute top-3 right-3 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 active:scale-90 transition-all duration-200"
        aria-label="Close"
        @click="handleClose"
      >
        <span class="i-ph-x text-lg" />
      </button>

      <!-- Image with padding -->
      <div class="relative w-full flex-shrink-0 px-4 pt-4" :class="isFlying ? 'aspect-square' : 'aspect-[4/5]'">
        <NuxtImg
          v-if="image"
          :src="getImageSrc(image, 'fullscreen').src"
          :provider="getImageSrc(image, 'fullscreen').provider"
          :modifiers="getImageSrc(image, 'fullscreen').modifiers"
          :alt="image.name || 'Image'"
          class="w-full h-full object-cover select-none rounded-2xl"
          draggable="false"
          loading="eager"
        />
      </div>

      <!-- Info section -->
      <div v-if="image && !isFlying" class="bg-white dark:bg-gray-900 flex-1 overflow-y-auto px-4 pt-3 pb-2">
        <h2 class="font-title font-700 text-base text-gray-900 dark:text-gray-100 truncate">
          {{ image.name || 'Untitled' }}
        </h2>
        <p v-if="image.description" class="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {{ image.description }}
        </p>
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
        <div class="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
          <span class="flex items-center gap-1"><span class="i-ph-eye text-sm" />{{ image.stats_views ?? 0 }}</span>
          <span class="flex items-center gap-1"><span class="i-ph-download-simple text-sm" />{{ image.stats_downloads ?? 0 }}</span>
          <span class="flex-1" />
          <span class="text-gray-300 dark:text-gray-600">{{ currentPosition }} / {{ totalImages }}</span>
        </div>
      </div>

      <!-- Actions bar -->
      <div v-if="image && !isFlying" class="bg-white dark:bg-gray-900 flex items-center justify-around px-2 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
        <ClientOnly>
          <NDropdownMenu
            v-if="downloadMenuItems.length > 0"
            :items="downloadMenuItems"
            size="xs"
            menu-label=""
            :_dropdown-menu-content="{
              class: 'w-44',
              align: 'center',
              side: 'top',
            }"
          >
            <button class="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 transition-colors">
              <span class="i-ph-download-simple text-lg text-gray-700 dark:text-gray-300" />
              <span class="text-[10px] font-500 text-gray-500 dark:text-gray-400">Download</span>
            </button>
          </NDropdownMenu>
          <button v-else class="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 transition-colors" @click="handleDownload">
            <span class="i-ph-download-simple text-lg text-gray-700 dark:text-gray-300" />
            <span class="text-[10px] font-500 text-gray-500 dark:text-gray-400">Download</span>
          </button>
          <template #fallback>
            <button class="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 transition-colors" @click="handleDownload">
              <span class="i-ph-download-simple text-lg text-gray-700 dark:text-gray-300" />
              <span class="text-[10px] font-500 text-gray-500 dark:text-gray-400">Download</span>
            </button>
          </template>
        </ClientOnly>
        <button class="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 transition-colors" @click="$emit('fullPage')">
          <span class="i-ph-arrow-square-out text-lg text-gray-700 dark:text-gray-300" />
          <span class="text-[10px] font-500 text-gray-500 dark:text-gray-400">Full page</span>
        </button>
        <button class="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 transition-colors" @click="$emit('openEditDrawer', image)">
          <span class="i-ph-pencil-simple text-lg text-gray-700 dark:text-gray-300" />
          <span class="text-[10px] font-500 text-gray-500 dark:text-gray-400">Edit</span>
        </button>
        <ClientOnly>
          <NDropdownMenu v-if="imageMenuItems" :items="wrappedMenuItems" size="sm" menu-label="" :_dropdown-menu-content="{ class: 'w-52', align: 'center', side: 'top' }">
            <button class="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 transition-colors">
              <span class="i-ph-dots-three-vertical text-lg text-gray-700 dark:text-gray-300" />
              <span class="text-[10px] font-500 text-gray-500 dark:text-gray-400">More</span>
            </button>
          </NDropdownMenu>
          <template #fallback>
            <button class="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl opacity-50">
              <span class="i-ph-dots-three-vertical text-lg text-gray-700 dark:text-gray-300" />
              <span class="text-[10px] font-500 text-gray-500 dark:text-gray-400">More</span>
            </button>
          </template>
        </ClientOnly>
      </div>

      <div v-if="!isFlying" class="bg-white dark:bg-gray-900 flex-shrink-0" style="padding-bottom: env(safe-area-inset-bottom);" />
    </div>
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

const { downloadImage, downloadAspectVariant, getAspectVariantsFromLayout, normalizeTags } = useImageActions()
const { getTagBadgeStyles } = useTagColor()
const displayTags = computed(() => normalizeTags(props.image?.tags))

const aspectVariants = computed(() => {
  if (!props.image) return []
  return getAspectVariantsFromLayout(props.image)
})

const downloadMenuItems = computed(() => {
  const variants = aspectVariants.value
  if (variants.length === 0) return []
  const items: Array<{ label: string; onClick?: () => void; disabled?: boolean } | {}> = [
    {
      label: 'Download',
      onClick: () => { if (props.image) downloadImage(props.image) },
    },
  ]
  items.push({})
  items.push({ label: 'Download variants', disabled: true })
  for (const v of variants) {
    items.push({
      label: v.aspect_label || 'Variant',
      onClick: () => downloadAspectVariant(v),
    })
  }
  return items
})

const isFlying = ref(false)
const isClosing = ref(false)
const hasTransition = ref(false)
const flyRect = ref<DOMRect | null>(null)
const flyTransform = ref('')

// After fly ends, card uses targetRect (real card size) instead of flyRect (thumbnail size)
const targetRect = ref<DOMRect | null>(null)
const cardRect = computed(() => targetRect.value || flyRect.value)

function getTargetDimensions(vw: number, vh: number) {
  const w = Math.min(vw * 0.85, 384)
  // Image: w - 32px padding (px-4 each side), aspect-[4/5]
  const imageW = w - 32
  const imageH = imageW * (5 / 4)
  // Card: 16px top padding + image + 120px info + 56px actions + 20px safe
  const h = 16 + imageH + 120 + 56 + 20
  const x = (vw - w) / 2
  const y = (vh - h) / 2
  return new DOMRect(x, y, w, h)
}

const handleDownload = () => {
  if (!props.image) return
  downloadImage(props.image)
}

// --- FLIP: Enter ---
watch(() => props.isOpen, (open) => {
  if (!open) return
  isClosing.value = false
  targetRect.value = null
  const rect = imageModal.sourceRect.value
  if (rect && props.image) {
    startEnterFly(rect)
  }
})

function startEnterFly(src: DOMRect) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const target = getTargetDimensions(vw, vh)

  flyRect.value = new DOMRect(src.left, src.top, src.width, src.height)
  flyTransform.value = 'none'
  hasTransition.value = false
  isFlying.value = true

  const s = Math.min(target.width / src.width, target.height / src.height)
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
    targetRect.value = null
    flyTransform.value = ''
    hasTransition.value = false
    emit('close')
  } else {
    // Fly finished: switch from thumbnail-sized card + scale to real-sized card + no scale
    const vw = window.innerWidth
    const vh = window.innerHeight
    targetRect.value = getTargetDimensions(vw, vh)
    flyTransform.value = 'none'
    isFlying.value = false
    hasTransition.value = false
  }
}

// --- FLIP: Leave ---
function handleClose() {
  if (!props.image) { emit('close'); return }

  const src = imageModal.sourceRect.value
  if (!src) { emit('close'); return }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const target = getTargetDimensions(vw, vh)

  // Reverse: scale from target → thumbnail
  const closeScale = Math.min(src.width / target.width, src.height / target.height)
  const targetCenterX = target.x + target.width / 2
  const targetCenterY = target.y + target.height / 2
  const thumbCenterX = src.left + src.width / 2
  const thumbCenterY = src.top + src.height / 2
  const closeTx = (thumbCenterX - targetCenterX) / closeScale
  const closeTy = (thumbCenterY - targetCenterY) / closeScale

  flyRect.value = new DOMRect(target.x, target.y, target.width, target.height)
  targetRect.value = null
  flyTransform.value = 'none'
  hasTransition.value = false
  isClosing.value = true
  isFlying.value = true

  nextTick(() => {
    requestAnimationFrame(() => {
      hasTransition.value = true
      flyTransform.value = `scale(${closeScale}) translate3d(${closeTx}px, ${closeTy}px, 0)`
    })
  })
}

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
