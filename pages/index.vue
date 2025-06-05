<template>
  <!-- pages/index.vue -->
  <div class="frame"
    @drop.prevent="imageUpload.handleDrop"
    @dragenter.prevent="imageUpload.handleDragEnter"
    @dragover.prevent="imageUpload.handleDragOver"
    @dragleave.prevent="imageUpload.handleDragLeave"
  >

    <PageHeader 
      :user-menu-items="imageActions.generateUserMenuItems(imageUpload.triggerFileUpload, clear)" 
    />

    <!-- Upload Progress Indicator -->
    <div v-if="imageUpload.isUploading.value" class="fixed top-4 right-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-64">
        <div class="flex items-center gap-3">
          <div class="i-ph-upload-simple animate-bounce text-blue-500"></div>
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Uploading images...
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div 
                class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                :style="`width: ${imageUpload.uploadProgress.value}%`"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ImageUploadZone
      :show-empty-state="!layout.length"
      :is-dragging="imageUpload.isDragging.value"
      :is-uploading="imageUpload.isUploading.value"
      :upload-progress="imageUpload.uploadProgress.value"
      :logged-in="loggedIn"
      @upload="imageUpload.triggerFileUpload"
      @dragenter="imageUpload.handleDragEnter"
      @dragover="imageUpload.handleDragOver"
      @dragleave="imageUpload.handleDragLeave"
    />

    <ImageGrid
      :layout="layout"
      :col-num="colNum"
      :row-height="rowHeight"
      :is-draggable="isDraggable"
      :is-resizable="isResizable"
      :show-grid="showGrid"
      :show-grid-opacity="showGridOpacity"
      :logged-in="loggedIn"
      @image-click="imageModal.openImageModal"
      @mouse-down="imageModal.handleMouseDown"
      @layout-update="gridStore.layout = $event"
      @layout-ready="layoutReady"
      @layout-updated="layoutUpdated"
      :image-menu-items="(item: Image) => imageActions.generateImageMenuItems({
        image: item, 
        openImagePageFn: imageModal.openImagePage, 
        openAddToCollectionModalFn: addToCollection.openModal,
        replacementFileInput,
      })"
    />

    <input
      type="file"
      ref="fileInput"
      class="hidden"
      accept="image/*"
      multiple
      @change="imageUpload.handleFileSelect"
    />
    <input
      type="file"
      ref="replacementFileInput"
      class="hidden"
      accept="image/*"
      @change="imageUpload.handleReplaceFileSelect"
    />

    <ImageModal
      :is-image-modal-open="imageModal.isImageModalOpen.value"
      :selected-modal-image="imageModal.selectedModalImage.value"
      :current-position="imageModal.currentPosition.value"
      :total-images="imageModal.totalImages.value"
      :can-navigate-previous="imageModal.canNavigatePrevious.value"
      :can-navigate-next="imageModal.canNavigateNext.value"
      :image-menu-items="(item: Image) => imageActions.generateImageMenuItems({
        image: item, 
        openImagePageFn: imageModal.openImagePage, 
        openAddToCollectionModalFn: addToCollection.openModal,
        replacementFileInput,
      })"
      @open-full-page="imageModal.openImagePage"
      @navigate-previous="imageModal.navigateToPrevious"
      @navigate-next="imageModal.navigateToNext"
      @navigate-to-first="imageModal.navigateToFirst"
      @navigate-to-last="imageModal.navigateToLast"
      @update-image-modal-open="imageModal.isImageModalOpen.value = $event"
    />

    <ImageEditModal
      :is-open="imageActions.showEditModal.value"
      :edit-form="imageActions.editForm.value"
      :available-tags="imageActions.availableTags"
      :is-updating="imageActions.isUpdating.value"
      :is-form-valid="imageActions.isEditFormValid.value"
      @close="imageActions.closeEditModal"
      @submit="imageActions.handleEditSubmit"
      @update-field="imageActions.updateEditFormField"
      @is-open="imageActions.showEditModal.value = $event"
    />

    <AddToCollectionModal
      v-model:is-open="addToCollection.isOpen.value"
      :selected-image="addToCollection.selectedImage.value"
      :collections="addToCollection.collections.value"
      :selected-collection="addToCollection.selectedCollection.value"
      :is-loading="addToCollection.isLoading.value"
      :is-adding="addToCollection.isAdding.value"
      :error="addToCollection.error.value"
      @add-to-collection="addToCollection.addImageToCollection"
      @select-collection="addToCollection.selectCollection"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~/types/image'
import { useGridStore } from '@/stores/useGridStore'
import { useImageUpload } from '~/composables/image/useImageUpload'
import { useImageModal } from '~/composables/image/useImageModal'
import { useImageActions } from '~/composables/image/useImageActions'
import { useAddToCollectionModal } from '~/composables/collection/useAddToCollectionModal'

const { loggedIn, clear } = useUserSession()
const gridStore = useGridStore()
const layout = computed(() => gridStore.layout)

const imageActions = useImageActions()
const imageModal = useImageModal()
const imageUpload = useImageUpload()
const addToCollection = useAddToCollectionModal()

const replacementFileInput = imageUpload.replacementFileInput
const fileInput = imageUpload.fileInput

const showGrid = ref(false)
const showGridOpacity = ref(false)
const isDraggable = computed(() => loggedIn.value)
const isResizable = computed(() => loggedIn.value)

const colNum = ref(14)
const rowHeight = ref(37)

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

  onUnmounted(() => {
    window.removeEventListener('resize', updateRowHeight)
  })
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
.frame {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: auto;
  min-height: 100vh;
  width: 100%;
  border-radius: 0.75rem;
  transition: all 500ms;
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
}
</style>
