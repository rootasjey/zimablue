// pages/index.vue
<template>
  <div class="flex flex-col justify-center 
    overflow-auto
    min-h-screen w-full rounded-xl md:p-8 transition-all duration-500"
      @drop.prevent="handleDrop"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent
      @dragleave.prevent="handleDragLeave"
  >

    <!-- Overlay for drag state -->
    <div v-if="isDragging && loggedIn" 
         class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50"
         @dragenter.prevent
         @dragover.prevent
         @dragleave.prevent="isDragging = false">
      <div class="text-white text-xl">Drop your images here</div>
    </div>

    <!-- Header -->
    <header class="mb-8 flex flex-col items-center justify-center">
      <h1 class="font-body text-xl font-600 text-gray-800 dark:text-gray-200">
        zima blue
      </h1>

      <div class="flex items-center gap-2 text-gray-800 dark:text-gray-200 text-12px opacity-50">
        <div :class="timeIcon" class="cursor-pointer hover:scale-120 hover:accent-rose active:scale-99 transition"
          @click="$colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'" />

        <h2 class="text-gray-800 dark:text-gray-200">
          {{ greeting }} • {{ new Date().toLocaleDateString("fr-FR", {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          }) }}
        </h2>

        <UDropdownMenu 
          v-if="loggedIn"
          :items="userMenuItems" 
          size="xs" 
          menu-label=""
          :_dropdown-menu-content="{
            class: 'w-52',
            align: 'end',
            side: 'bottom',
          }" 
          :_dropdown-menu-trigger="{
            icon: false,
            square: false,
            class: 'ring-transparent p-0 hover:bg-transparent hover:scale-105 active:scale-99 transition',
            label: `• ${username}`,
          }" 
        />
      </div>
    </header>

    <div v-if="!layout.length" 
        class="flex flex-col justify-center gap-4 items-center">
      <div class="flex gap-4">
        <div v-for="n in 3" 
          :key="n"
          @click="triggerFileUpload"
          class="w-24 h-24 border-2 
            group
            hover:scale-105 active:scale-95
            border-dashed border-gray-300 dark:border-gray-700 
            rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 
            transition duration-200 
            flex flex-col items-center justify-center">
          
            <div class="i-ph-image-square-duotone group-hover:opacity-0 group-hover:scale-0 text-2xl text-gray-400 dark:text-gray-600 transition-all duration-300" />
            <div class="i-lucide-plus absolute opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 text-gray-400 dark:text-gray-600 transition-all duration-300" />
        </div>
      </div>
      <h2 class="font-size-4 font-mono font-600 text-gray-500 dark:text-gray-600">
        Upload your first image 
        <span class="i-ph:hand-pointing-bold"></span> 
      </h2>
    </div>

    <!-- Mobile Grid with 3 columns -->
    <div v-if="layout.length" class="grid sm:hidden grid-cols-3 gap-5 mx-4">
      <div v-for="item in layout" :key="item.i" 
        class="mobile-group aspect-square relative overflow-hidden 
        rounded-7 z-2 cursor-pointer transition duration-900"
      >
        <NuxtImg 
            :provider="item.pathname.includes('blob') ? 'ipx' : 'hubblob'"
            height="200"
            :src="item.pathname" 
            :alt="item.pathname"
            class="nuxt-img object-cover w-full h-full rounded-7 transition-transform duration-400 hover:scale-105"
            :style="`view-transition-name: shared-image-${item.id}`"
            @mousedown="(e: MouseEvent) => { dragStartPos = { x: e.clientX, y: e.clientY } }"
            @click.self="(event: MouseEvent) => openImage(item, event)"
          />
      </div>
    </div>

    <!-- Desktop Grid -->
    <GridLayout
      v-model:layout="layout"
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
      @layout-ready="layoutReady"
      @layout-updated="layoutUpdated"
    >
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        class="rounded-lg"
      >
        <div 
          class="group h-full relative overflow-hidden rounded-lg z-10 cursor-pointer"
          >
          <NuxtImg 
            :provider="item.pathname.includes('blob') ? 'ipx' : 'hubblob'"
            height="200"
            :src="item.pathname" 
            :alt="item.pathname"
            class="nuxt-img object-cover w-full h-full transition-transform duration-200 hover:scale-105"
            :style="`view-transition-name: shared-image-${item.id}`"
            @mousedown="(e: MouseEvent) => { dragStartPos = { x: e.clientX, y: e.clientY } }"
            @click.self="(event: MouseEvent) => openImage(item, event)"
          />

          <div class="absolute h-32px w-32px 
            bottom-1 right-1 rounded-lg backdrop-blur-md
            bg-white/20 dark:bg-black/60 hover:bg-white/40 dark:hover:bg-black/80 
            invisible group-hover:visible flex justify-center items-center">
            <span class="vgl-item__resizer 
            i-ph-arrow-down-right-duotone
            invisible group-hover:visible z-2
            hover:scale-110 active:scale-99 transition"></span>
          </div>

          <UDropdownMenu 
            :items="imageMenuItems(item)" 
            size="xs" 
            menu-label="" 
            :_dropdown-menu-content="{
              class: 'w-52',
              align: 'end',
              side: 'bottom',
            }" 
            :_dropdown-menu-trigger="{
              icon: true,
              square: true,
              class: DROPDOWN_MENU_TRIGGER_CLASS,
              label: 'i-lucide-ellipsis-vertical',
            }" 
          />
        </div>
      </GridItem>
    </GridLayout>


    <input
      type="file"
      ref="fileInput"
      class="hidden"
      accept="image/*"
      multiple
      @change="handleFileSelect"
    />
    <input
      type="file"
      ref="replacementFileInput"
      class="hidden"
      accept="image/*"
      @change="handleReplaceFileSelect"
    />

    <div v-if="loggedIn" class="fixed bottom-6 left-0 right-0 flex justify-center items-center">
      <div class="border backdrop-blur-md bg-white/20 dark:bg-black/20 shadow-lg rounded-full flex justify-center items-center gap-4">
        <UButton 
          icon
          rounded="full"
          btn="ghost"
          label="i-ph-plus-bold"
          @click="triggerFileUpload"
          />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~/types/image'
import { GridLayout, GridItem } from 'grid-layout-plus'
import { useGridStore } from '@/stores/useGridStore'

const { loggedIn, user, clear } = useUserSession()
const gridStore = useGridStore()
const layout = computed(() => gridStore.layout)

const router = useRouter()

const { toast } = useToast()

const isDragging = ref(false)
let dragCounter = 0

const showGrid = ref(false)
const showGridOpacity = ref(false)
const isDraggable = computed(() => loggedIn.value)
const isResizable = computed(() => loggedIn.value)

const fileInput = ref<HTMLInputElement>()
const replacementFileInput = ref<HTMLInputElement>()

// @ts-ignore
const username = computed(() => user.value?.name ?? "")

const colNum = ref(14)
const rowHeight = ref(37)

const dragStartPos = ref({ x: 0, y: 0 })
const DRAG_THRESHOLD = 5 // pixels

const DROPDOWN_MENU_TRIGGER_CLASS = `
  menu-trigger 
  color-white 
  absolute top-1 right-1 p-1
  ring-0 invisible group-hover:visible rounded-lg backdrop-blur-md
  bg-white/20 dark:bg-black/60 
  hover:bg-white/40 dark:hover:bg-black/80 hover:scale-110 active:scale-99 transition b-0
  `

const updateRowHeight = () => {
  const windowWidth = window.innerWidth
  if (windowWidth < 640) { rowHeight.value = 8; return; }
  if (windowWidth < 700) { rowHeight.value = 14; return; }
  if (windowWidth < 860) { rowHeight.value = 16; return; }
  if (windowWidth < 990) { rowHeight.value = 20; return; }
  if (windowWidth < 1024) { rowHeight.value = 24; return; }
  if (windowWidth < 1130) { rowHeight.value = 26; return; }
  if (windowWidth < 1350) { rowHeight.value = 28; return; }
  rowHeight.value = 37 // desktop
}

gridStore.fetchGrid()

onMounted(() => {
  updateRowHeight()
  window.addEventListener('resize', updateRowHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateRowHeight)
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Good night'
})

const timeIcon = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'i-ph-sun-horizon'
  if (hour >= 12 && hour < 17) return 'i-line-md:moon-to-sunny-outline-loop-transition'
  if (hour >= 17 && hour < 22) return 'i-ph:sun-horizon-bold'
  return 'i-line-md:moon-rising-twotone-loop'
})

function openImage(item: Image, event: MouseEvent) {
  const moveDistance = Math.sqrt(
    Math.pow(event.clientX - dragStartPos.value.x, 2) + 
    Math.pow(event.clientY - dragStartPos.value.y, 2)
  )

  if (moveDistance > DRAG_THRESHOLD) {
    return
  }

  gridStore.selectedImage = item
  gridStore.prefetchAdjacentImages(item.id)

  if (!document.startViewTransition) {
    router.push({
      path: `/illustrations/${item.id}`,
      state: {
        imageData: JSON.parse(JSON.stringify(item)),
        previousPath: router.currentRoute.value.fullPath
      }
    })
    return
  }

  document.startViewTransition(async () => {
    await router.push({
      path: `/illustrations/${item.id}`,
      state: {
        imageData: JSON.parse(JSON.stringify(item)),
        previousPath: router.currentRoute.value.fullPath
      }
    })
  })
}

function handleDragLeave(e: DragEvent) {
  dragCounter--
  if (dragCounter === 0) {
    isDragging.value = false
  }
}

function handleDragEnter(e: DragEvent) {
  dragCounter++
  isDragging.value = true
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false
  dragCounter = 0

  if (!loggedIn.value) {
    toast({
      showProgress: true,
      title: 'Login Required',
      description: 'You must be logged in to upload images.',
      toast: 'soft-warning',
    })
    return
  }

  if (!e.dataTransfer) return
  const files = [...e.dataTransfer.files].filter(file => file.type.startsWith('image/'))
  const uploadResults = await gridStore.uploadImages(files)
  
  // Handle successful and failed uploads
  const successful = uploadResults
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value)

  const failed = uploadResults
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map(result => result.reason)

  toast({
    title: failed.length > 0 ? 'Upload Results' : 'Upload Success',
    description: failed.length > 0 
      ? `${successful.length} uploaded, ${failed.length} failed` 
      : `Successfully uploaded ${successful.length} images`,
    duration: 5000,
    showProgress: true,
    toast: failed.length > 0 ? 'soft-warning' : 'soft-success'
  })

  layoutUpdated(layout.value)
}

const imageMenuItems = (image: Image) => {
  const items: Array<{ label: string, onClick?: () => void } | {}> = [
    {
      label: 'Download',
      onClick: () => {
        const link = document.createElement('a')
        link.href = image.pathname
        link.download = image.pathname
        link.click()
      },
    },
  ]

  if (loggedIn.value) {
    items.splice(items.length, 0, 
      {}, // to add a separator between items (label or items should be null).
      {
        label: 'Replace',
        onClick: () => {
          gridStore.selectedImage = image
          replacementFileInput.value?.click()
        },
      },
      {
        label: 'Delete',
        onClick: () => gridStore.deleteImage(image.id),
      },
    )
  }

  return items
}

const userMenuItems = [
  {
    label: 'Upload',
    onClick: () => {
      triggerFileUpload()
    },
  },
  {
    label: 'Logout',
    onClick: () => {
      clear()
    },
  },
]

function layoutUpdated(newLayout: any) {
  if (!loggedIn.value) return
  gridStore.saveLayout(newLayout)
}

function layoutReady(layout: any) {
  showGrid.value = true
  setTimeout(() => {
    showGridOpacity.value = true
  }, 250);
}

function triggerFileUpload() {
  if (!loggedIn.value) {
    toast({
      showProgress: true,
      title: 'Login Required',
      description: 'You must be logged in to upload images.',
      toast: 'soft-warning',
    })
    return
  }

  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  if (!loggedIn.value) {
    toast({
      showProgress: true,
      title: 'Login Required',
      description: 'You must be logged in to upload images.',
      toast: 'soft-warning',
    })
    return
  }

  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const files = Array.from(input.files)
  const uploadResults = await gridStore.uploadImages(files)
  layoutUpdated(layout.value)

  // Reuse existing upload success/error handling
  const successful = uploadResults
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value)

  const failed = uploadResults
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map(result => result.reason)

  console.log(`handleFileSelect: `, successful, failed)
  toast({
    title: failed.length > 0 ? 'Upload Results' : 'Upload Success',
    description: failed.length > 0 
      ? `${successful.length} uploaded, ${failed.length} failed` 
      : `Successfully uploaded ${successful.length} images`,
    duration: 5000,
    showProgress: true,
    toast: failed.length > 0 ? 'soft-warning' : 'soft-success'
  })

  input.value = '' // Reset input
}

async function handleReplaceFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  const imageToReplace = gridStore.selectedImage

  if (!imageToReplace) return
  console.log(`imageToReplace:`, imageToReplace)

  try {
    await gridStore.replaceImage(file, imageToReplace.id)
    toast({
      title: 'Replace Success',
      description: 'Successfully replaced image',
      duration: 5000,
      showProgress: true,
      toast: 'soft-success'
    })
  } catch (error) {
    toast({
      title: 'Replace Failed',
      description: 'Failed to replace image',
      duration: 5000,
      showProgress: true,
      toast: 'soft-warning'
    })
  }

  input.value = '' // Reset input
}

</script>

<style scoped>
.i-ph-sun-horizon,
.i-line-md\:moon-to-sunny-outline-loop-transition {
  animation: fadeScale 0.3s ease-in-out;
}

@keyframes fadeScale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

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

.vgl-item__resizer {
  animation: colorPulse 6s infinite;
}

@keyframes colorPulse {
  0% { color: rgb(244 114 182); }  /* pink-400 */
  33% { color: rgb(134 239 172); }  /* green-300 */
  66% { color: rgb(129 140 248); }  /* indigo-400 */
  100% { color: rgb(244 114 182); }  /* back to pink-400 */
}

:deep(.menu-trigger[data-state="open"]) {
  visibility: visible;
}

</style>
