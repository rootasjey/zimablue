<template>
  <section>
    <!-- Image count header + selection controls -->
    <div class="flex items-center mb-4">
      <h3 class="text-3 font-600 text-gray-800 dark:text-gray-200">
        {{ images.length }} Images
      </h3>

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

    <div data-collection-grid class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-8">
      <div
        v-for="(image, index) in images"
        :key="image.id"
        :class="[
          'group relative overflow-hidden rounded-sm ring-offset-2 ring-offset-white dark:ring-offset-gray-900 transition-all duration-150 cursor-pointer animate-fade-in-up',
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
          class="w-full aspect-[4/4] object-cover"
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
}

const props = defineProps<Props>()

const emit = defineEmits<{
  clearSelection: []
  imageClick: [image: Image]
  removeImages: []
  enterSelectionMode: [imageId: number]
  toggleImage: [imageId: number]
  setHighlight: [index: number]
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
</style>
