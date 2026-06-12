<template>
  <section>
    <!-- Image count header + selection controls -->
    <div class="flex justify-center md:justify-start items-center mt-4 mb-4 md:ml-2">
      <div class="ml-0 flex gap-2 items-center">
        <h3 class="text-3 font-600 text-gray-800 dark:text-gray-200">
          {{ images.length }} Images
        </h3>

        <span class="text-gray-600 dark:text-gray-400">•</span>

        <h3 class="text-3 font-600 text-gray-600 dark:text-gray-500">
          {{ collectionStats.views }} views
        </h3>
        <span class="text-gray-600 dark:text-gray-400">•</span>
        <h3 class="text-3 font-600 text-gray-600 dark:text-gray-500">
          {{ collectionStats.likes }} likes
        </h3>
      </div>

      <div
        v-if="canEdit && isSelectionMode"
        class="ml-12 flex gap-2 transition-opacity duration-200"
        :class="hasSelectedImages ? 'opacity-100' : 'opacity-0'"
      >
        <NButton size="12px" btn="soft-gray" @click="$emit('clearSelection')">
          <i class="i-ph-x"></i>
          <span>Cancel</span>
        </NButton>
        <NButton
          v-if="hasSelectedImages"
          size="12px"
          btn="soft-error"
          @click="$emit('removeImages')"
        >
          Remove {{ selectionCount }} Images
        </NButton>
      </div>
    </div>

    <div data-collection-grid class="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-5 md:gap-8">
      <div
        v-for="(image, index) in images"
        :key="image.id"
        :draggable="canEdit && !isSelectionMode"
        :class="[
          'group relative overflow-hidden rounded-xl ring-offset-2 ring-offset-white dark:ring-offset-gray-900 transition-all duration-200 animate-fade-in-up active:scale-[0.97]',
          canEdit && !isSelectionMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
          highlightedImageIndex === index && isSelectionMode
            ? 'ring-2 ring-blue-500'
            : highlightedImageIndex === index
              ? 'ring-2 ring-pink-500'
              : 'ring-1 ring-gray-200/60 dark:ring-gray-800/60 hover:ring-gray-300/70 dark:hover:ring-gray-700/70 hover:shadow-md active:shadow-sm',
        ]"
        :style="{ animationDelay: `${index * 50}ms` }"
        @click="handleImageClick(image, index, $event)"
        @pointerdown="handlePointerDown(image, index, $event)"
        @pointermove="handlePointerMove($event)"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
        @dragstart="handleDragStart($event, image)"
      >
        <!-- Cover image badge -->
        <div
          v-if="coverImageId != null && image.id === coverImageId"
          class="absolute top-2 left-2 z-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-600 text-white bg-black/50 backdrop-blur-sm shadow-sm select-none"
        >
          <i class="i-ph-star-fill text-xs" />
          <span>Cover</span>
        </div>

        <!-- Selection mode: checkbox -->
        <div
          v-if="canEdit && isSelectionMode"
          class="opacity-0 group-hover:opacity-100 absolute top-2 right-2 z-2 transition-opacity duration-150"
          :class="{ 'opacity-100': hasSelectedImages }"
          @click.stop
        >
          <NCheckbox v-model:model-value="selectedImagesMap[image.id]" />
        </div>

        <!-- Normal mode: dropdown menu (desktop only) -->
        <ClientOnly>
          <div
            v-if="canEdit && !isSelectionMode"
            class="hidden sm:block absolute top-2 right-2 z-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            @click.stop
          >
            <NDropdownMenu
              :items="imageMenuItems(image)"
              size="xs"
              :_dropdown-menu-content="{ class: 'w-48 rounded-2xl p-2 shadow-xl', align: 'end', side: 'bottom' }"
              :_dropdown-menu-trigger="{
                icon: true,
                square: true,
                label: 'i-ph-dots-three-bold',
                class: 'dp-menu-trigger',
              }"
            />
          </div>
        </ClientOnly>

        <NuxtImg
          provider="hubblob"
          :width="100"
          :src="`/${image.pathname}`"
          :modifiers="{ v: image.updated_at }"
          :alt="image.name || 'Image'"
          class="w-full aspect-[4/4] object-cover pointer-events-none"
          :style="{ viewTransitionName: `image-${image.id}` }"
          loading="lazy"
          decoding="async"
        />
        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <h3 class="text-gray-200 text-sm font-medium truncate">{{ image.name }}</h3>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { Image } from '~~/shared/types/image'

interface Props {
  canEdit: boolean
  coverImageId: number | null
  hasSelectedImages: boolean
  images: Image[]
  isSelectionMode: boolean
  selectedImagesMap: Record<number, boolean>
  selectionCount: number
  imageMenuItems: (image: Image) => Array<Record<string, any>>
  highlightedImageIndex: number
  collectionStats: { views: number; likes: number }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  clearSelection: []
  imageClick: [image: Image]
  removeImages: []
  enterSelectionMode: [imageId: number]
  toggleImage: [imageId: number]
  setHighlight: [index: number]
  imageDragStart: [image: Image]
}>()

// --- Long press detection ---
const longPressDelay = 600
const longPressThreshold = 10
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressStartPos = { x: 0, y: 0 }
let longPressTriggered = false
let longPressImageId: number | null = null

const handleImageClick = (image: Image, index: number, _event: MouseEvent) => {
  emit('setHighlight', index)
  if (longPressTriggered) {
    longPressTriggered = false
    return
  }
  if (props.isSelectionMode && props.canEdit) {
    emit('toggleImage', image.id)
    return
  }
  emit('imageClick', image)
}

const handlePointerDown = (image: Image, _index: number, event: PointerEvent) => {
  if (props.isSelectionMode) return
  if (longPressTimer) {
    clearTimeout(longPressTimer)
  }
  longPressTriggered = false
  longPressStartPos = { x: event.clientX, y: event.clientY }
  longPressImageId = image.id

  longPressTimer = setTimeout(() => {
    longPressTriggered = true
    if (longPressImageId != null) {
      emit('enterSelectionMode', longPressImageId)
    }
  }, longPressDelay)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!longPressTimer) return
  const dx = event.clientX - longPressStartPos.x
  const dy = event.clientY - longPressStartPos.y
  if (Math.abs(dx) > longPressThreshold || Math.abs(dy) > longPressThreshold) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

const handlePointerUp = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const handleDragStart = (event: DragEvent, image: Image) => {
  if (props.isSelectionMode || !event.dataTransfer) return

  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }

  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/x-zimablue-image', JSON.stringify({ imageId: image.id }))

  const gridItem = event.currentTarget as HTMLElement
  const existingImg = gridItem.querySelector('img')

  if (existingImg?.complete) {
    const size = 160
    const radius = 12
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // Dark background visible while the (already-decoded) image renders
      ctx.fillStyle = '#18181b'
      ctx.fillRect(0, 0, size, size)

      // Rounded clip, then draw the image synchronously from the existing DOM node
      roundRectPath(ctx, 0, 0, size, size, radius)
      ctx.save()
      ctx.clip()
      ctx.drawImage(existingImg, 0, 0, size, size)

      // Bottom gradient + image name
      const grad = ctx.createLinearGradient(0, size - 32, 0, size)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, 'rgba(0,0,0,0.65)')
      ctx.fillStyle = grad
      ctx.fillRect(0, size - 32, size, 32)

      ctx.fillStyle = '#ffffff'
      ctx.font = '600 11px system-ui, sans-serif'
      let displayName = image.name || ''
      if (ctx.measureText(displayName).width > size - 16) {
        while (displayName.length > 0 && ctx.measureText(displayName + '…').width > size - 16) {
          displayName = displayName.slice(0, -1)
        }
        displayName += '…'
      }
      ctx.fillText(displayName, 8, size - 9)

      // Cover badge
      const isCover = props.coverImageId != null && props.coverImageId === image.id
      if (isCover) {
        roundRectPath(ctx, 6, 6, 52, 18, 9)
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = '500 9px system-ui, sans-serif'
        ctx.fillText('★ Cover', 12, 19)
      }

      ctx.restore()

      event.dataTransfer.setDragImage(canvas, size / 2, size / 2)
      emit('imageDragStart', image)
      return
    }
  }

  emit('imageDragStart', image)
}
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
  opacity: 1;
  transform: none;
}

.group:hover {
  transform: translateY(-2px);
}

.group:active {
  transform: translateY(0);
}

@media (hover: none) {
  .group:hover {
    transform: none;
  }
}
</style>
