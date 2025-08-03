<template>
  <div>
    <!-- Mobile Grid with 3 columns -->
    <div
      v-if="layout.length"
      class="grid sm:hidden grid-cols-3 gap-5 mx-4 mt-12"
      role="grid"
      :aria-label="`Image grid with ${layout.length} images${isSelectionMode ? ', selection mode active' : ''}`"
    >
      <div v-for="(item, index) in layout" :key="item.i"
        class="mobile-group aspect-square relative overflow-hidden
        rounded-7 z-2 cursor-pointer transition duration-900"
        :class="{
          'ring-2 ring-blue-500 ring-offset-2': isSelectionMode && selectedImagesMap?.[item.id],
          'opacity-75': isSelectionMode && !selectedImagesMap?.[item.id] && hasSelectedImages
        }"
        role="gridcell"
        :aria-selected="isSelectionMode ? (selectedImagesMap?.[item.id] || false) : undefined"
        :aria-label="`Image ${item.name || 'untitled'}${isSelectionMode ? (selectedImagesMap?.[item.id] ? ', selected' : ', not selected') : ''}`"
        @mousedown="$emit('mouseDown', $event)"
      >
        <!-- Selection checkbox for mobile -->
        <div
          v-if="loggedIn && isSelectionMode"
          class="absolute top-2 right-2 z-20"
          @click.stop="$emit('imageToggle', item.id, index, $event)"
        >
          <UCheckbox
            :model-value="selectedImagesMap?.[item.id] || false"
            checkbox="success"
          />
        </div>

        <NuxtImg
          @click="(event: MouseEvent) => handleImageClick(item, index, event)"
          @pointerdown="(event: PointerEvent) => handleImagePointerDown(item, index, event)"
          @pointermove="handleImagePointerMove"
          @pointerup="handleImagePointerUp"
          @pointercancel="handleImagePointerCancel"
          loading="lazy"
          width="120"
          :provider="item.pathname.includes('blob') ? 'ipx' : 'hubblob'"
          :src="item.pathname"
          :alt="item.pathname"
          class="nuxt-img-mobile"
          :style="`view-transition-name: shared-image-${item.id}`"
        />
      </div>
    </div>

    <!-- Desktop Grid -->
    <GridLayout
      :layout="layout"
      @update:layout="$emit('layoutUpdate', $event)"
      :col-num="colNum"
      :row-height="rowHeight"
      :is-draggable="isDraggable"
      :is-resizable="isResizable"
      vertical-compact
      use-css-transforms
      v-show="showGrid"
      class="transition-all duration-100 hidden sm:block w-100% sm:w-auto md:w-auto"
      :class="showGridOpacity ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      :responsive="false"
      role="grid"
      :aria-label="`Image grid with ${layout.length} images${isSelectionMode ? ', selection mode active' : ''}`"
      @layout-ready="$emit('layoutReady', $event)"
      @layout-updated="$emit('layoutUpdated', $event)"
    >
      <GridItem
        v-for="(item, index) in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :is-draggable="!item.pathname.includes('blob')"
        :is-resizable="!item.pathname.includes('blob')"
        class="rounded-lg grid-item"
        role="gridcell"
        :aria-selected="isSelectionMode ? (selectedImagesMap?.[item.id] || false) : undefined"
        :aria-label="`Image ${item.name || 'untitled'}${isSelectionMode ? (selectedImagesMap?.[item.id] ? ', selected' : ', not selected') : ''}`"
        :style="{
          '--delay': `${index * 0.05}s`
        }"
      >
        <div
          class="group h-full relative overflow-hidden rounded-lg z-10 cursor-pointer"
          :class="{
            'ring-2 ring-blue-500 ring-offset-2': isSelectionMode && selectedImagesMap?.[item.id],
            'opacity-75': isSelectionMode && !selectedImagesMap?.[item.id] && hasSelectedImages
          }"
        >
          <!-- Selection checkbox for desktop -->
          <div
            v-if="loggedIn && isSelectionMode"
            class="absolute top-2 right-2 z-20"
            @click.stop="$emit('imageToggle', item.id, index, $event)"
          >
            <UCheckbox
              :model-value="selectedImagesMap?.[item.id] || false"
              checkbox="success"
            />
          </div>

          <NuxtImg
            @click="(event: MouseEvent) => handleImageClick(item, index, event)"
            @pointerdown="(event: PointerEvent) => handleImagePointerDown(item, index, event)"
            @pointermove="handleImagePointerMove"
            @pointerup="handleImagePointerUp"
            @pointercancel="handleImagePointerCancel"
            loading="lazy"
            :provider="item.pathname.includes('blob') ? 'ipx' : 'hubblob'"
            :src="`${item.pathname}`"
            :alt="item.pathname"
            :width="240"
            class="nuxt-img"
            :style="`view-transition-name: shared-image-${item.id}`"
          />

          <div v-if="loggedIn && !isSelectionMode" class="image-resizer-container">
            <span class="vgl-item__resizer image-resizer"></span>
          </div>

          <UDropdownMenu
            v-if="!isSelectionMode"
            :items="imageMenuItems(item)"
            size="xs"
            menu-label=""
            :_dropdown-menu-content="{
              class: 'w-52',
              align: 'end',
              side: 'bottom',
            }"
          >
            <div class="dp-menu-trigger w-32px h-32px flex items-center justify-center">
              <span class="i-ph-chat-teardrop-dots-bold"></span>
            </div>
          </UDropdownMenu>
        </div>
      </GridItem>
    </GridLayout>
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~/types/image'
import { GridLayout, GridItem } from 'grid-layout-plus'

interface Props {
  layout: Image[]
  colNum: number
  rowHeight: number
  isDraggable: boolean
  isResizable: boolean
  showGrid: boolean
  showGridOpacity: boolean
  loggedIn: boolean
  imageMenuItems: (image: Image) => ({} | {
    label: string;
    onClick?: () => void;
})[]
  // Multi-select props
  isSelectionMode?: boolean
  selectedImagesMap?: Record<number, boolean>
  hasSelectedImages?: boolean
}

interface Emits {
  imageClick: [item: Image, event: MouseEvent]
  mouseDown: [event: MouseEvent]
  layoutUpdate: [layout: Image[]]
  layoutReady: [layout: Image[]]
  layoutUpdated: [layout: Image[]]
  // Multi-select emits
  imageToggle: [imageId: number, index: number, event: MouseEvent]
  enterSelectionMode: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Long press detection using pointer events for better reliability
const longPressTimer = ref<NodeJS.Timeout | null>(null)
const isLongPressing = ref(false)
const longPressDelay = 600 // 600ms for long press (slightly longer for better UX)
const currentLongPressItem = ref<{ item: Image, index: number } | null>(null)
const pointerStartPosition = ref<{ x: number, y: number } | null>(null)
const dragThreshold = 10 // pixels - if pointer moves more than this, it's considered a drag

// Handle image click - either for selection or normal modal
const handleImageClick = (item: Image, index: number, event: MouseEvent) => {
  // Prevent action if we just completed a long press
  if (isLongPressing.value) {
    isLongPressing.value = false
    return
  }

  // Check for Ctrl/Cmd + Click to enter selection mode
  if (!props.isSelectionMode && (event.ctrlKey || event.metaKey)) {
    emit('enterSelectionMode')
    // Wait for next tick to ensure selection mode is active, then toggle
    nextTick(() => {
      emit('imageToggle', item.id, index, event)
    })
    return
  }

  if (props.isSelectionMode) {
    // In selection mode, clicking the image toggles selection
    emit('imageToggle', item.id, index, event)
  } else {
    // Normal mode, open image modal
    emit('imageClick', item, event)
  }
}

// Handle pointer down for long press detection
const handleImagePointerDown = (item: Image, index: number, event: PointerEvent) => {
  // Only handle primary pointer (left mouse button or first touch)
  if (!event.isPrimary || event.button !== 0) {
    return
  }

  // Emit mouseDown event for drag detection in image modal
  emit('mouseDown', event as any)

  // Don't start long press if already in selection mode
  if (props.isSelectionMode) {
    return
  }

  // Store initial pointer position for drag detection
  pointerStartPosition.value = { x: event.clientX, y: event.clientY }

  // Clear any existing timer
  clearLongPressTimer()

  isLongPressing.value = false
  currentLongPressItem.value = { item, index }

  // Start long press timer
  longPressTimer.value = setTimeout(() => {
    if (currentLongPressItem.value && pointerStartPosition.value) {
      isLongPressing.value = true
      emit('enterSelectionMode')
      // Wait for next tick to ensure selection mode is active, then toggle
      nextTick(() => {
        if (currentLongPressItem.value) {
          emit('imageToggle', currentLongPressItem.value.item.id, currentLongPressItem.value.index, event as any)
        }
      })
    }
  }, longPressDelay)

  // Capture the pointer to ensure we get pointer events even if mouse moves outside element
  ;(event.target as Element)?.setPointerCapture?.(event.pointerId)
}

// Handle pointer move to detect dragging
const handleImagePointerMove = (event: PointerEvent) => {
  if (!event.isPrimary || !pointerStartPosition.value) return

  // Calculate distance moved
  const deltaX = Math.abs(event.clientX - pointerStartPosition.value.x)
  const deltaY = Math.abs(event.clientY - pointerStartPosition.value.y)
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  // If moved beyond threshold, cancel long press (user is dragging)
  if (distance > dragThreshold) {
    clearLongPressTimer()
    currentLongPressItem.value = null
    pointerStartPosition.value = null
  }
}

// Handle pointer up to clear long press timer
const handleImagePointerUp = (event: PointerEvent) => {
  if (!event.isPrimary) return

  clearLongPressTimer()

  // Release pointer capture
  ;(event.target as Element)?.releasePointerCapture?.(event.pointerId)

  // Reset state
  pointerStartPosition.value = null

  // Reset long press flag after a short delay to allow click handler to check it
  setTimeout(() => {
    isLongPressing.value = false
    currentLongPressItem.value = null
  }, 50)
}

// Handle pointer cancel (when pointer is interrupted)
const handleImagePointerCancel = (event: PointerEvent) => {
  if (!event.isPrimary) return

  clearLongPressTimer()
  isLongPressing.value = false
  currentLongPressItem.value = null
  pointerStartPosition.value = null

  // Release pointer capture
  ;(event.target as Element)?.releasePointerCapture?.(event.pointerId)
}

// Utility function to clear long press timer
const clearLongPressTimer = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

// Cleanup on unmount
onUnmounted(() => {
  clearLongPressTimer()
})
</script>

<style scoped>
:deep(.vgl-item) {
  box-shadow: rgba(149, 157, 165, 0.4) 0px 8px 24px;
  transition: all 0.2s ease-in-out;

  .dark & {
    box-shadow: rgba(0, 0, 0, 0.4) 0px 8px 24px;
  }

  &:hover {
    box-shadow: rgba(149, 157, 165, 0.8) 0px 8px 24px;

    .dark & {
      box-shadow: rgba(0, 0, 0, 0.8) 0px 8px 24px;
    }
  }

  &:active {
    box-shadow: rgba(0, 0, 0, 0) 0px 8px 24px;
    .dark & {
      box-shadow: rgba(0, 0, 0, 0.0) 0px 8px 24px;
    }
  }
}

.mobile-group {
  /* Remove the existing box-shadow and add these classes */
  &:nth-child(3n) {
    box-shadow: rgba(244, 114, 182, 0.4) 0px 8px 24px; /* Pink shadow */
  }

  &:nth-child(3n+1) {
    box-shadow: rgba(134, 239, 172, 0.4) 0px 8px 24px; /* Green shadow */
  }

  &:nth-child(3n+2) {
    box-shadow: rgba(129, 140, 248, 0.4) 0px 8px 24px; /* Indigo shadow */
  }

  &:nth-child(4n) {
    box-shadow: rgb(255, 167, 37, 0.4) 0px 8px 24px;
  }

  &:nth-child(5n) {
    box-shadow: rgb(152, 216, 239, 0.4) 0px 8px 24px;
  }

  /* Hover states with increased opacity */
  &:nth-child(3n):hover {
    box-shadow: rgba(244, 114, 182, 0.8) 0px 8px 24px;
  }

  &:nth-child(3n+1):hover {
    box-shadow: rgba(134, 239, 172, 0.8) 0px 8px 24px;
  }

  &:nth-child(3n+2):hover {
    box-shadow: rgba(129, 140, 248, 0.8) 0px 8px 24px;
  }

  &:nth-child(4n):hover {
    box-shadow: rgb(255, 167, 37, 0.8) 0px 8px 24px; /* Indigo shadow */
  }

  &:nth-child(5n):hover {
    box-shadow: rgb(152, 216, 239, 0.8) 0px 8px 24px;
  }

  /* Active state remains the same */
  &:active {
    box-shadow: rgba(0, 0, 0, 0) 0px 8px 24px;
  }
}

:deep(.vgl-item > .vgl-item__resizer) {
  display: none;
}

:deep(.vgl-item__resizer) {
  height: 24px;
  width: 24px;
  position: relative;
}

.group:hover .vgl-item__resizer {
  animation: colorPulse 6s infinite;
}

.group:hover .dp-menu-trigger {
  animation: colorPulse 6s infinite;
}

@keyframes colorPulse {
  0% { color: rgb(244 114 182); }  /* pink-400 */
  16% { color: rgb(255 167 37); }  /* orange-400 */
  33% { color: rgb(134 239 172); }  /* green-300 */
  66% { color: rgb(129 140 248); }  /* indigo-400 */
  100% { color: rgb(244 114 182); }  /* back to pink-400 */
}

:deep(.menu-trigger[data-state="open"]) {
  visibility: visible;
}

.grid-item {
  opacity: 0;
  transform-origin: center;
  animation: fadeInUp 0.6s ease-out forwards;
  animation-delay: var(--delay);
}

.nuxt-img {
  object-fit: cover;
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  transition: transform 150ms;
  
  &:hover {
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.nuxt-img-mobile {
  object-fit: cover;
  width: 100%;
  height: 100%;
  border-radius: 7px;
  transition: transform 150ms;

  &:hover {
    transform: scale(1.05);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    filter: blur(2px);
    padding: 8px;
  }
  to {
    opacity: 1;
    filter: blur(0);
    padding: 0;
  }
}
</style>