<template>
  <!-- pages/index.vue -->
  <div class="flex flex-col justify-center 
    overflow-auto
    min-h-screen w-full rounded-xl md:p-8 transition-all duration-500"
      @drop.prevent="handleDrop"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
  >

    <PageHeader :user-menu-items="generateUserMenuItems(triggerFileUpload, clear)" />

    <!-- Upload Progress Indicator (optional) -->
    <div v-if="isUploading" class="fixed top-4 right-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-64">
        <div class="flex items-center gap-3">
          <div class="i-ph-upload-simple animate-spin text-blue-500"></div>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Uploading images...
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div 
                class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                :style="`width: ${uploadProgress}%`"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ImageUploadZone
      :show-empty-state="!layout.length"
      :is-dragging="isDragging"
      :is-uploading="isUploading"
      :upload-progress="uploadProgress"
      :logged-in="loggedIn"
      @upload="triggerFileUpload"
      @dragenter="handleDragEnter"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    />

    <!-- Mobile Grid with 3 columns -->
    <div v-if="layout.length" class="grid sm:hidden grid-cols-3 gap-5 mx-4">
      <div v-for="item in layout" :key="item.i" 
        class="mobile-group aspect-square relative overflow-hidden 
        rounded-7 z-2 cursor-pointer transition duration-900"
        @click.self="(event: MouseEvent) => openImageModal(item, event)"
        @mousedown="handleMouseDown"
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
            @mousedown="handleMouseDown"
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
            :items="generateImageMenuItems(item, openImagePage, replacementFileInput)" 
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

    <!-- <div class="flex justify-center mt-12">
      <Footer />
    </div> -->

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
            <UButton btn="ghost-pink" @click="closeEditModal">
              Cancel
            </UButton>
            <UButton 
              btn="outline" 
              @click="handleEditSubmit"
              :loading="isUpdating"
              :disabled="!isEditFormValid"
            >
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
            {{ currentPosition }} of {{ totalImages }}
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
import type { Image } from '~/types/image'
import { GridLayout, GridItem } from 'grid-layout-plus'
import { useGridStore } from '@/stores/useGridStore'
import { useImageUpload } from '~/composables/image/useImageUpload'
import { useImageModal } from '~/composables/image/useImageModal'
import { useImageActions } from '~/composables/image/useImageActions'

const { loggedIn, user, clear } = useUserSession()
const gridStore = useGridStore()
const layout = computed(() => gridStore.layout)

const {
  isDragging,
  isUploading,
  uploadProgress,
  fileInput,
  replacementFileInput,
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  triggerFileUpload,
  handleFileSelect,
  handleReplaceFileSelect,
} = useImageUpload()

const {
  isImageModalOpen,
  selectedModalImage,
  currentImageIndex,
  canNavigatePrevious,
  canNavigateNext,
  totalImages,
  currentPosition,
  openImageModal,
  closeModal,
  navigateToPrevious,
  navigateToNext,
  openImagePage,
  handleMouseDown,
} = useImageModal()
// Add this after your other composable calls
const {
  showEditModal,
  editForm,
  availableTags,
  isDeleting,
  isUpdating,
  isEditFormValid,
  openEditModal,
  closeEditModal,
  handleEditSubmit,
  deleteImage,
  downloadImage,
  generateImageMenuItems,
  generateUserMenuItems,
} = useImageActions()

const showGrid = ref(false)
const showGridOpacity = ref(false)
const isDraggable = computed(() => loggedIn.value)
const isResizable = computed(() => loggedIn.value)

// @ts-ignore
const username = computed(() => user.value?.name ?? "")

const colNum = ref(14)
const rowHeight = ref(37)

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
  
  // Clean up keyboard listener in unmounted
  onUnmounted(() => {
    window.removeEventListener('resize', updateRowHeight)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateRowHeight)
})

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
