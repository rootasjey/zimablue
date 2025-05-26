<template>
  <!-- pages/index.vue -->
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
        <NuxtLink to="/about">
        zima blue
        </NuxtLink>
      </h1>
      <div class="text-gray-800 dark:text-gray-200 text-3 font-500 opacity-50">
        <span>Illustrations gallery & </span>
        <ULink to="/collections" class="text-size-3 font-500 hover:scale-105 active:scale-99 transition">
          <span>collections </span>
        </ULink>

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
            class: 'ring-transparent p-0 shadow-none hover:bg-transparent hover:scale-105 active:scale-99 transition',
            label: ` •`,
          }"
        />
      </div>

      <!-- Greeting -->
      <div class="flex justify-center items-center flex-wrap gap-2">
        <UTooltip content="Go back" :_tooltip-content="{
          side: 'right',
        }">
          <template #default>
            <div :class="timeIcon" 
              class="cursor-pointer hover:scale-120 hover:accent-rose active:scale-99 transition" 
              @click="$colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'" 
              @click.right="$colorMode.preference = 'system'"
            />
          </template>
          <template #content>
            <button @click="$colorMode.preference = 'system'" bg="light dark:dark" text="dark dark:white" text-3 px-3 py-1 rounded-md m-0
              border-1 border-dashed class="b-#3D3BF3">
              System theme
            </button>
          </template>
        </UTooltip>

        <span class="text-size-3 font-500 text-gray-800 dark:text-gray-200">
          {{ greeting }}
        </span>

        <ULink to="/time" class="text-size-3 font-500 text-gray-800 dark:text-gray-200">
           • {{ new Date().toLocaleDateString("fr-FR", { 
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }) }}
        </ULink>

        <ULink to="/contact" class="text-size-3 font-500 hover:scale-102 active:scale-99 transition">
          <span>• </span>
          <span>contact me</span>
          <span class="i-ph-envelope-simple-open-duotone ml-1"></span>
        </ULink>
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

      <div class="max-w-300px text-center">
        <h2 class="mt-2 font-size-4 font-text font-500 text-gray-800 dark:text-gray-200">
          This is an image gallery to share what you love with others. 
          Use it with caution and without moderation.
          <span class="i-ph:hand-pointing-bold"></span> 
        </h2>
      </div>
    </div>

    <!-- Mobile Grid with 3 columns -->
    <div v-if="layout.length" class="grid sm:hidden grid-cols-3 gap-5 mx-4">
      <div v-for="item in layout" :key="item.i" 
        class="mobile-group aspect-square relative overflow-hidden 
        rounded-7 z-2 cursor-pointer transition duration-900"
        @click.self="(event: MouseEvent) => openImageModal(item, event)"
      >
        <NuxtImg 
          loading="lazy"
          width="120"
          :provider="item.pathname.includes('blob') ? 'ipx' : 'hubblob'"
          :src="item.pathname" 
          :alt="item.pathname"
          class="nuxt-img object-cover w-full h-full rounded-7 transition-transform duration-400 hover:scale-105"
          :style="`view-transition-name: shared-image-${item.id}`"
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
        :style="{
          '--delay': `${index * 0.15}s`
        }"
      >
        <div 
          class="group h-full relative overflow-hidden rounded-lg z-10 cursor-pointer"
          >
          <NuxtImg 
            @mousedown="(e: MouseEvent) => { dragStartPos = { x: e.clientX, y: e.clientY } }"
            @click.self="(event: MouseEvent) => openImageModal(item, event)"
            loading="lazy"
            :provider="item.pathname.includes('blob') ? 'ipx' : 'hubblob'"
            :src="`${item.pathname}`" 
            :alt="item.pathname"
            :width="240"
            class="nuxt-img object-cover w-full h-full rounded-lg  transition-transform duration-200 hover:scale-105 active:scale-98"
            :style="`view-transition-name: shared-image-${item.id}`"
          />

          <div v-if="loggedIn" class="absolute h-32px w-32px 
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

    <div class="flex justify-center mt-12">
      <Footer />
    </div>

    <UDialog 
      v-model:open="showEditModal" 
      :ui="{ width: 'sm:max-w-md' }" 
      :_dialog-close="{
      btn: 'solid-gray',
      }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              Edit Image Details
            </h3>
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Name" name="name">
            <UInput v-model="editForm.name" placeholder="Image name" />
          </UFormGroup>
          
          <UFormGroup label="Slug" name="slug">
            <UInput v-model="editForm.slug" placeholder="URL-friendly slug" />
          </UFormGroup>
          
          <UFormGroup label="Description" name="description">
            <UInput v-model="editForm.description" type="textarea" placeholder="Image description" />
          </UFormGroup>
          
          <UFormGroup label="Tags" name="tags">
             <UCombobox
                v-model="editForm.tags"
                :items="availableTags"
                by="value"
                multiple
                :_combobox-input="{
                  placeholder: 'Select tags...',
                }"
                :_combobox-list="{
                  class: 'w-300px',
                  align: 'start',
                }"
              >
                <template #trigger>
                  {{ editForm.tags?.length > 0
                    ? editForm.tags.map(val => {
                      const tag = availableTags.find(f => f.value === val)
                      return tag ? tag.label : val
                    }).join(", ")
                    : "Select tags..." }}
                </template>

                <template #item="{ item, selected }">
                  <UCheckbox
                    :model-value="selected"
                    tabindex="-1"
                    aria-hidden="true"
                  />
                  {{ item.label }}
                </template>
              </UCombobox>
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton btn="ghost-pink" @click="showEditModal = false">
              Cancel
            </UButton>
            <UButton btn="outline" @click="handleEditSubmit">
              Save Changes
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>

    <!-- Image Modal -->
    <UDialog v-model:open="isImageModalOpen" :ui="{ width: 'max-w-7xl' }">
      <div class="relative">
        <!-- Modal header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ selectedModalImage?.name || 'Image' }}
            </h3>
            <p v-if="selectedModalImage?.description" class="text-sm text-gray-500 dark:text-gray-400">
              {{ selectedModalImage.description }}
            </p>
          </div>
          <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{{ selectedModalImage?.stats_views }} views</span>
            <span>{{ selectedModalImage?.stats_likes }} likes</span>
            <UButton 
              size="xs" 
              btn="primary" 
              icon
              class="i-ph-arrow-square-up-right text-size-2"
              @click="openImagePage"
              title="Open in full page"
            />
          </div>
        </div>
        
        <!-- Modal content -->
        <div class="p-4">
          <div class="flex justify-center">
            <NuxtImg 
              v-if="selectedModalImage"
              :provider="selectedModalImage.pathname.includes('blob') ? 'ipx' : 'hubblob'"
              :src="selectedModalImage.pathname"
              :alt="selectedModalImage.name || 'Image'"
              :width="600"
              class="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </div>
        
        <!-- Modal footer with navigation -->
        <div class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <UButton 
            btn="ghost" 
            size="sm" 
            :disabled="!canNavigatePrevious"
            @click="navigateToPrevious"
          >
            <span class="i-ph-arrow-left mr-1"></span>
            Previous
          </UButton>
          
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ currentImageIndex + 1 }} of {{ layout.length }}
          </span>
          
          <UButton 
            btn="ghost" 
            size="sm" 
            :disabled="!canNavigateNext"
            @click="navigateToNext"
          >
            Next
            <span class="i-ph-arrow-right ml-1"></span>
          </UButton>
        </div>
      </div>
    </UDialog>
  </div>
</template>

<script lang="ts" setup>
import type { Image, VariantType } from '~/types/image'
import { GridLayout, GridItem } from 'grid-layout-plus'
import { useGridStore } from '@/stores/useGridStore'

const { loggedIn, user, clear } = useUserSession()
const gridStore = useGridStore()
const layout = computed(() => gridStore.layout)

const router = useRouter()

const { toast } = useToast()

const showGrid = ref(false)
const showGridOpacity = ref(false)
const isDraggable = computed(() => loggedIn.value)
const isResizable = computed(() => loggedIn.value)

const fileInput = ref<HTMLInputElement>()
const replacementFileInput = ref<HTMLInputElement>()

// Modal state
const isImageModalOpen = ref(false)
const selectedModalImage = ref<Image | null>(null)
const currentImageIndex = ref(0)

// Modal navigation computed properties
const canNavigatePrevious = computed(() => currentImageIndex.value > 0)
const canNavigateNext = computed(() => currentImageIndex.value < layout.value.length - 1)

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

const showEditModal = ref(false)
const editForm = ref({
  name: '',
  description: '',
  slug: '',
  // tags: '',
  tags: [],
})

const availableTags = [
  { value: "abstract", label: "Abstract" },
  { value: "anime", label: "Anime" },
  { value: "cartoon", label: "Cartoon" },
  { value: "comic", label: "Comic" },
  { value: "landscape", label: "Landscape" },
  { value: "litterature", label: "Litterature" },
  { value: "movie", label: "Movie" },
  { value: "music", label: "Music" },
  { value: "poetry", label: "Poetry" },
  { value: "portrait", label: "Portrait" },
  { value: "tv-show", label: "TV Show" },
  { value: "video-game", label: "Video Game" },
]

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

  // Keyboard navigation for modal
  const handleKeydown = (e: KeyboardEvent) => {
    if (!isImageModalOpen.value) return
    
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      navigateToPrevious()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      navigateToNext()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      isImageModalOpen.value = false
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openImagePage()
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  
  // Clean up keyboard listener in unmounted
  onUnmounted(() => {
    window.removeEventListener('resize', updateRowHeight)
    window.removeEventListener('keydown', handleKeydown)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateRowHeight)
  // window.removeEventListener('keydown', handleKeydown)
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

// Modal methods
const openImageModal = (item: Image, event: MouseEvent) => {
  // Check if the user is dragging the image
  const moveDistance = Math.sqrt(
    Math.pow(event.clientX - dragStartPos.value.x, 2) + 
    Math.pow(event.clientY - dragStartPos.value.y, 2)
  )

  if (moveDistance > DRAG_THRESHOLD) {
    return
  }
  // --- end drag check ---

  selectedModalImage.value = item
  currentImageIndex.value = layout.value.findIndex(img => img.id === item.id)
  isImageModalOpen.value = true
}

const navigateToPrevious = () => {
  if (canNavigatePrevious.value) {
    currentImageIndex.value--
    selectedModalImage.value = layout.value[currentImageIndex.value]
  }
}

const navigateToNext = () => {
  if (canNavigateNext.value) {
    currentImageIndex.value++
    selectedModalImage.value = layout.value[currentImageIndex.value]
  }
}

const openImagePage = () => {
  if (!selectedModalImage.value) return
  
  const item = selectedModalImage.value
  isImageModalOpen.value = false
  
  // Use the existing openImage logic but without the drag check
  gridStore.selectedImage = item

  const urlPath = item.slug 
    ? `/illustrations/${item.slug}` 
    : `/illustrations/${item.id}`

  if (!document.startViewTransition) {
    router.push({
      path: urlPath,
      state: {
        imageData: JSON.parse(JSON.stringify(item)),
        previousPath: router.currentRoute.value.fullPath
      }
    })
    return
  }

  document.startViewTransition(async () => {
    await router.push({
      path: urlPath,
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
      label: 'View in fullscreen',
      onClick: () => {
        selectedModalImage.value = image
        openImagePage()
      },
    },
    {
      label: 'Download',
      onClick: () => {
        const variants: Array<VariantType> = JSON.parse(image.variants)
        const originalVariant = variants.find(variant => variant.size === 'original')

        const link = document.createElement('a')
        const imagePathname = `/${originalVariant?.pathname ?? image.pathname}`
        link.href = imagePathname
        link.download = image.name || imagePathname.split('/').pop() || 'image'
        link.click()
      },
    },
  ]

  if (loggedIn.value) {
    items.splice(items.length, 0, 
      {}, // separator
      {
        label: 'Edit',
        onClick: () => {
          gridStore.selectedImage = image
          showEditModal.value = true
        },
      },
      {
        label: 'Replace',
        onClick: () => {
          gridStore.selectedImage = image
          replacementFileInput.value?.click()
        },
      },
      {
        label: 'Delete',
        onClick: async () => {
          const response = await gridStore.deleteImage(image.id)
          if (!response?.success) {
            toast({
              showProgress: true,
              title: 'Error',
              description: response?.message || 'An error occurred while deleting the image.',
              toast: 'soft-warning',
            })
          }
        },
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

function layoutUpdated(newLayout: Image[]) {
  if (!loggedIn.value) return
  gridStore.saveLayout(newLayout)
}

function layoutReady(layout: Image[]) {
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

async function handleEditSubmit() {
  if (!gridStore.selectedImage) return
  
  try {
    await gridStore.updateImage({
      id: gridStore.selectedImage.id,
      name: editForm.value.name,
      description: editForm.value.description,
      slug: editForm.value.slug,
      tags: JSON.stringify(editForm.value.tags)
    })
    
    showEditModal.value = false
    toast({
      title: 'Update Success',
      description: 'Image details updated successfully',
      duration: 5000,
      showProgress: true,
      toast: 'soft-success'
    })
  } catch (error) {
    toast({
      title: 'Update Failed',
      description: 'Failed to update image details',
      duration: 5000,
      showProgress: true,
      toast: 'soft-warning'
    })
  }
}

watch(() => gridStore.selectedImage, (newImage) => {
  if (newImage) {
    editForm.value.name = newImage.name || ''
    editForm.value.description = newImage.description || ''
    editForm.value.slug = newImage.slug || ''
    editForm.value.tags = JSON.parse(newImage.tags) || []
  }
}, { immediate: true })

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

.grid-item {
  opacity: 0;
  transform-origin: center;
  animation: fadeInUp 0.6s ease-out forwards;
  animation-delay: var(--delay);
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
