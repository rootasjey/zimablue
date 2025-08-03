<template>
  <!-- pages/index.vue -->
  <div class="frame mt-2 md:mt-0 pb-20 sm:pb-0"
    @drop.prevent="imageUpload.handleDrop"
    @dragenter.prevent="imageUpload.handleDragEnter"
    @dragover.prevent="imageUpload.handleDragOver"
    @dragleave.prevent="imageUpload.handleDragLeave"
  >

    <PageHeader
      :user-menu-items="imageActions.generateUserMenuItems(imageUpload.triggerFileUpload, clear)"
    />

    <!-- Upload Progress Indicator -->
    <ImageUploadProgress
      :session="imageUpload.currentUploadSession.value"
      @close="imageUpload.clearUploadSession"
    />

    <ImageUploadZone
      :show-empty-state="!layout.length"
      :is-dragging="imageUpload.isDragging.value"
      :is-uploading="imageUpload.isUploading.value"
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
      :is-draggable="isDraggable && !multiSelect.isSelectionMode"
      :is-resizable="isResizable && !multiSelect.isSelectionMode"
      :show-grid="showGrid"
      :show-grid-opacity="showGridOpacity"
      :logged-in="loggedIn"
      :is-selection-mode="multiSelect.isSelectionMode.value"
      :selected-images-map="multiSelect.selectedImagesMap.value"
      :has-selected-images="multiSelect.hasSelectedImages.value"
      @image-click="imageModal.openImageModal"
      @image-toggle="(imageId: number, index: number, event: MouseEvent) => multiSelect.handleImageToggle(layout, imageId, index, event)"
      @enter-selection-mode="enterSelectionMode"
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

    <!-- Multi-select components -->
    <SelectionToolbar
      :is-visible="multiSelect.hasSelectedImages.value && loggedIn"
      :selection-count="multiSelect.selectionCount.value"
      :is-all-selected="multiSelect.isAllSelected(layout)"
      @toggle-select-all="multiSelect.toggleSelectAll(layout)"
      @add-to-collection="openBulkAddToCollectionDialog"
      @delete-selected="openBulkDeleteDialog"
      @clear-selection="multiSelect.clearSelection"
    />

    <BulkDeleteDialog
      v-model:is-open="showBulkDeleteDialog"
      :image-count="multiSelect.selectionCount.value"
      :selected-image-ids="multiSelect.selectedImageIds.value"
      @confirm="handleBulkDelete"
    />

    <BulkAddToCollectionDialog
      v-model:is-open="showBulkAddToCollectionDialog"
      :image-count="multiSelect.selectionCount.value"
      :selected-image-ids="multiSelect.selectedImageIds.value"
      :collections="bulkCollections"
      :is-loading-collections="isLoadingBulkCollections"
      :error="bulkCollectionsError || undefined"
      @confirm="handleBulkAddToCollection"
      @create-collection="navigateToCreateCollection"
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
import { useHomeMultiSelect } from '~/composables/image/useHomeMultiSelect'
import SelectionToolbar from '~/components/image/SelectionToolbar.vue'
import BulkDeleteDialog from '~/components/image/BulkDeleteDialog.vue'
import BulkAddToCollectionDialog from '~/components/image/BulkAddToCollectionDialog.vue'

const { loggedIn, clear } = useUserSession()
const gridStore = useGridStore()
const layout = computed(() => gridStore.layout)

const imageActions = useImageActions()
const imageModal = useImageModal()
const imageUpload = useImageUpload()
const addToCollection = useAddToCollectionModal()
const multiSelect = useHomeMultiSelect()

const replacementFileInput = imageUpload.replacementFileInput
const fileInput = imageUpload.fileInput

const showGrid = ref(false)
const showGridOpacity = ref(false)
const isDraggable = computed(() => loggedIn.value)
const isResizable = computed(() => loggedIn.value)

const colNum = ref(14)
const rowHeight = ref(37)

// Multi-select dialog states
const showBulkDeleteDialog = ref(false)
const showBulkAddToCollectionDialog = ref(false)

// Bulk collections state
const bulkCollections = ref<any[]>([])
const isLoadingBulkCollections = ref(false)
const bulkCollectionsError = ref<string | null>(null)

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
  window.addEventListener('keydown', handleGlobalKeydown)

  onUnmounted(() => {
    window.removeEventListener('resize', updateRowHeight)
    window.removeEventListener('keydown', handleGlobalKeydown)
  })
})

// Global keyboard shortcuts
const handleGlobalKeydown = (event: KeyboardEvent) => {
  // Only handle shortcuts when logged in and not in input fields
  if (!loggedIn.value ||
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement) {
    return
  }

  multiSelect.handleKeyboardShortcuts(event, layout.value)
}

function layoutUpdated(newLayout: Image[]) {
  if (!loggedIn.value) return
  gridStore.saveLayout(newLayout)
}

function layoutReady(_layout: Image[]) {
  showGrid.value = true
  setTimeout(() => {
    showGridOpacity.value = true
  }, 250);
}

// Multi-select dialog handlers
const openBulkDeleteDialog = () => {
  if (multiSelect.selectionCount.value > 0) {
    showBulkDeleteDialog.value = true
  }
}

const openBulkAddToCollectionDialog = async () => {
  if (multiSelect.selectionCount.value > 0) {
    await fetchBulkCollections()
    showBulkAddToCollectionDialog.value = true
  }
}

const fetchBulkCollections = async () => {
  try {
    isLoadingBulkCollections.value = true
    bulkCollectionsError.value = null

    const data = await $fetch('/api/collections')
    bulkCollections.value = (data.collections || [])
  } catch (err) {
    console.error('Error fetching collections:', err)
    bulkCollectionsError.value = 'Failed to load collections. Please try again.'
  } finally {
    isLoadingBulkCollections.value = false
  }
}

const handleBulkDelete = async (imageIds: number[]) => {
  try {
    const result = await multiSelect.bulkDeleteImages(imageIds)

    if (result.success) {
      showBulkDeleteDialog.value = false
      // Show success toast
      const { toast } = useToast()
      toast({
        title: 'Images Deleted',
        description: result.message,
        duration: 3000,
        showProgress: true,
        toast: 'soft-success'
      })
    } else {
      // Show error toast
      const { toast } = useToast()
      toast({
        title: 'Delete Failed',
        description: result.message,
        duration: 5000,
        showProgress: true,
        toast: 'soft-warning'
      })
    }
  } catch (error) {
    console.error('Bulk delete error:', error)
    const { toast } = useToast()
    toast({
      title: 'Delete Failed',
      description: 'An unexpected error occurred',
      duration: 5000,
      showProgress: true,
      toast: 'soft-warning'
    })
  }
}

const handleBulkAddToCollection = async (imageIds: number[], collectionSlug: string) => {
  try {
    const result = await multiSelect.bulkAddToCollection(imageIds, collectionSlug)

    if (result.success) {
      showBulkAddToCollectionDialog.value = false
      // Show success toast
      const { toast } = useToast()
      toast({
        title: 'Added to Collection',
        description: result.message,
        duration: 3000,
        showProgress: true,
        toast: 'soft-success'
      })
    } else {
      // Show error toast
      const { toast } = useToast()
      toast({
        title: 'Add Failed',
        description: result.message,
        duration: 5000,
        showProgress: true,
        toast: 'soft-warning'
      })
    }
  } catch (error) {
    console.error('Bulk add to collection error:', error)
    const { toast } = useToast()
    toast({
      title: 'Add Failed',
      description: 'An unexpected error occurred',
      duration: 5000,
      showProgress: true,
      toast: 'soft-warning'
    })
  }
}

const navigateToCreateCollection = () => {
  navigateTo('/collections/create')
}

// Enter selection mode (triggered by long press or Ctrl+click)
const enterSelectionMode = () => {
  // The multiSelect composable will automatically enter selection mode when an image is toggled
  // This method is mainly for future extensibility
}

</script>

<style scoped>
.frame {
  display: flex;
  flex-direction: column;
  overflow: auto;
  min-height: 100vh;
  width: 100%;
  border-radius: 0.75rem;
  transition: all 500ms;
  
  @media (min-width: 768px) {
    justify-content: center;
    padding: 2rem;
  }
}
</style>
