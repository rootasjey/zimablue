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
        :draggable="canEdit && !isSelectionMode && !showContextMenu"
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
        @dragstart="handleDragStart($event, image)"
        @contextmenu="(e) => handleContextMenu(e, image)"
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

    <ImageContextMenu
      :is-open="showContextMenu"
      :x="contextMenuPos.x"
      :y="contextMenuPos.y"
      :items="contextMenuItems"
      @close="showContextMenu = false"
      @show-native="handleContextMenuShowNative"
    />
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

const handleImageClick = (image: Image, index: number, _event: MouseEvent) => {
  emit('setHighlight', index)
  if (props.isSelectionMode && props.canEdit) {
    emit('toggleImage', image.id)
    return
  }
  emit('imageClick', image)
}

// --- Right-click context menu ---
const showContextMenu = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const contextMenuImage = ref<Image | null>(null)
const bypassNativeMenu = ref(false)

const contextMenuItems = computed(() => {
  if (!contextMenuImage.value) return []
  return props.imageMenuItems(contextMenuImage.value)
})

function handleContextMenu(event: MouseEvent, image: Image) {
  if (props.isSelectionMode) return
  if (bypassNativeMenu.value) {
    bypassNativeMenu.value = false
    return
  }
  event.preventDefault()
  contextMenuImage.value = image
  contextMenuPos.value = { x: event.clientX, y: event.clientY }
  showContextMenu.value = true
}

function handleContextMenuShowNative() {
  showContextMenu.value = false
  bypassNativeMenu.value = true
}

const handleDragStart = (event: DragEvent, image: Image) => {
  if (props.isSelectionMode || !event.dataTransfer) return

  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/x-zimablue-image', JSON.stringify({ imageId: image.id }))

  // Ghost container — all visual styling comes from CSS classes
  const ghostSize = 176
  const ghost = document.createElement('div')
  ghost.className = 'rounded-xl overflow-hidden shadow-2xl shadow-blue-500/10 ring-1 ring-white/15 bg-zinc-900 relative'
  ghost.style.cssText += `;width:${ghostSize}px;height:${ghostSize}px`

  const gridItem = event.currentTarget as HTMLElement
  const existingImg = gridItem.querySelector('img')

  // Canvas is used ONLY to capture the existing image synchronously.
  // drawImage works even if the image is cross‑origin (the canvas gets tainted
  // but still renders visually — we never read pixels back).
  if (existingImg?.complete) {
    const cvs = document.createElement('canvas')
    cvs.width = ghostSize
    cvs.height = ghostSize
    const ctx = cvs.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#18181b'
      ctx.fillRect(0, 0, ghostSize, ghostSize)

      // object-fit: cover — crop the source to match the square ghost
      const nw = existingImg.naturalWidth
      const nh = existingImg.naturalHeight
      if (nw > 0 && nh > 0) {
        const targetAR = 1 // ghost is square
        const imageAR = nw / nh
        let sx = 0, sy = 0, sw = nw, sh = nh
        if (imageAR > targetAR) {
          sw = nh * targetAR
          sx = (nw - sw) / 2
        } else if (imageAR < targetAR) {
          sh = nw / targetAR
          sy = (nh - sh) / 2
        }
        ctx.drawImage(existingImg, sx, sy, sw, sh, 0, 0, ghostSize, ghostSize)
      }
    }
    cvs.style.cssText = 'width:100%;height:100%;display:block;filter:brightness(1.15)'
    ghost.appendChild(cvs)
  }

  // Bottom gradient + image name
  const overlay = document.createElement('div')
  overlay.className = 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 to-transparent pt-6 pb-1.5 px-2'
  const nameEl = document.createElement('span')
  nameEl.className = 'text-white text-[11px] font-600 truncate block'
  nameEl.textContent = image.name || ''
  overlay.appendChild(nameEl)
  ghost.appendChild(overlay)

  // Cover badge
  const isCover = props.coverImageId != null && props.coverImageId === image.id
  if (isCover) {
    const badge = document.createElement('div')
    badge.className = 'absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-600 text-white bg-black/50'
    badge.textContent = '★ Cover'
    ghost.appendChild(badge)
  }

  const center = ghostSize / 2
  document.body.appendChild(ghost)
  event.dataTransfer.setDragImage(ghost, center, center)
  requestAnimationFrame(() => document.body.removeChild(ghost))

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
