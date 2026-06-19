<template>
  <div>
    <ImageUploadProgress
      :session="imageUpload.currentUploadSession.value"
      @close="imageUpload.clearUploadSession"
    />

    <ImageGridLoading v-if="isInitialGridLoading" />

    <ImageUploadZone
      :show-empty-state="!layout.length && !isInitialGridLoading"
      :is-dragging="imageUpload.isDragging.value"
      :is-uploading="imageUpload.isUploading.value"
      :logged-in="loggedIn"
      @upload="imageUpload.triggerFileUpload"
    />

    <ImageGrid
      :layout="displayLayout"
      :col-num="colNum"
      :row-height="rowHeight"
      :is-loading="gridStore.isLoading"
      :is-draggable="isDraggable"
      :is-resizable="isResizable && !multiSelect.isSelectionMode.value"
      :vertical-compact="!multiSelect.isSelectionMode.value"
      :is-admin="isAdmin"
      :show-grid="showGrid"
      :show-grid-opacity="showGridOpacity"
      :logged-in="loggedIn"
      :is-selection-mode="multiSelect.isSelectionMode.value"
      :selected-images-map="multiSelect.selectedImagesMap.value"
      :has-selected-images="multiSelect.hasSelectedImages.value"
      :highlighted-image-index="keyboardNav.highlightedImageIndex.value"
      :show-initial-skeleton="!isInitialGridLoading"
      @image-click="imageModal.openImageModal"
      @image-toggle="handleImageToggle"
      @mouse-down="imageModal.handleMouseDown"
      @enter-selection-mode="multiSelect.enterSelectionMode"
      @layout-update="gridStore.applyIncomingLayout"
      @layout-ready="layoutReady"
      @layout-updated="layoutUpdated"
      @grid-drag-start="handleGridDragStart"
      @set-highlight="keyboardNav.setHighlightedImage"
      :image-menu-items="(item: Image) => imageActions.generateImageMenuItems({
        image: item,
        openImagePageFn: imageModal.openImagePage,
        openAddToCollectionModalFn: addToCollection.openModal,
        replacementFileInput,
      })"
    />

    <ImageModal
      ref="imageModalRef"
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
        aspectVariants: imageActions.getAspectVariantsFromLayout(item),
      })"
      @open-full-page="imageModal.openImagePage"
      @open-edit-modal="(img: Image) => imageActions.openEditModal(img)"
      @open-add-to-collection-modal="(img: Image) => addToCollection.openModal(img)"
      @replace-image="(img: Image) => imageActions.triggerImageReplacement(img, replacementFileInput)"
      @download-image="(img: Image) => imageActions.downloadImage(img)"
      @request-delete="(img: Image) => openImageDeleteDialog(img)"
      @navigate-previous="imageModal.navigateToPrevious"
      @navigate-next="imageModal.navigateToNext"
      @navigate-to-first="imageModal.navigateToFirst"
      @navigate-to-last="imageModal.navigateToLast"
      @update-image-modal-open="imageModal.isImageModalOpen.value = $event"
    />

    <ImageMobileFullscreen
      :is-open="imageModal.isImageFullscreenOpen.value"
      :image="imageModal.selectedModalImage.value"
      :prev-image="imageModal.prevImage.value"
      :next-image="imageModal.nextImage.value"
      :current-position="imageModal.currentPosition.value"
      :total-images="imageModal.totalImages.value"
      :can-go-prev="imageModal.canNavigatePrevious.value"
      :can-go-next="imageModal.canNavigateNext.value"
      :source-rect="imageModal.sourceRect.value"
      :image-menu-items="(item: Image) => imageActions.generateImageMenuItems({
        image: item,
        openImagePageFn: imageModal.openImagePage,
        openAddToCollectionModalFn: addToCollection.openModal,
        replacementFileInput,
        aspectVariants: imageActions.getAspectVariantsFromLayout(item),
      })"
      @close="imageModal.closeModal"
      @prev="imageModal.navigateToPrevious"
      @next="imageModal.navigateToNext"
      @full-page="imageModal.openImagePage"
      @open-edit-drawer="(img: Image) => imageActions.openEditDrawer(img)"
      @open-add-to-collection-drawer="(img: Image) => addToCollection.openDrawer(img)"
      @replace-image="(img: Image) => imageActions.triggerImageReplacement(img, replacementFileInput)"
      @request-delete="(img: Image) => openImageDeleteDialog(img)"
    />

    <ImageEditModal
      :is-open="imageActions.showEditModal.value"
      :edit-form="imageActions.editForm.value"
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

    <ImageEditDrawer
      v-model:is-open="imageActions.showEditDrawer.value"
      :edit-form="imageActions.editForm.value"
      :is-updating="imageActions.isUpdating.value"
      :is-form-valid="imageActions.isEditFormValid.value"
      @close="imageActions.closeEditDrawer"
      @submit="imageActions.handleEditSubmit"
      @update-field="imageActions.updateEditFormField"
      @update:isOpen="imageActions.showEditDrawer.value = $event"
    />

    <AddToCollectionDrawer
      v-model:is-open="addToCollection.isDrawerOpen.value"
      :selected-image="addToCollection.selectedImage.value"
      :collections="addToCollection.collections.value"
      :selected-collection="addToCollection.selectedCollection.value"
      :is-loading="addToCollection.isLoading.value"
      :is-adding="addToCollection.isAdding.value"
      :error="addToCollection.error.value"
      @add-to-collection="addToCollection.addImageToCollection"
      @select-collection="addToCollection.selectCollection"
    />

    <ImageSelectionToolbar
      :is-visible="multiSelect.hasSelectedImages.value"
      :selection-count="multiSelect.selectionCount.value"
      :is-all-selected="multiSelect.isAllSelected(layout)"
      @toggle-select-all="multiSelect.toggleSelectAll(layout)"
      @add-to-collection="openBulkAddToCollectionDialog"
      @download-selected="handleBulkDownload"
      @delete-selected="openBulkDeleteDialog"
      @clear-selection="multiSelect.clearSelection"
    />

    <ImageBulkDeleteDialog
      v-model:is-open="showBulkDeleteDialog"
      :image-count="multiSelect.selectionCount.value"
      :selected-image-ids="multiSelect.selectedImageIds.value"
      @confirm="handleBulkDelete"
    />

    <ImageBulkAddToCollectionDialog
      v-model:is-open="showBulkAddToCollectionDialog"
      :image-count="multiSelect.selectionCount.value"
      :selected-image-ids="multiSelect.selectedImageIds.value"
      :collections="bulkCollections"
      :is-loading-collections="isLoadingBulkCollections"
      :error="bulkCollectionsError || undefined"
      @confirm="handleBulkAddToCollection"
      @create-collection="navigateToCreateCollection"
    />

    <ImageDeleteDialog
      v-model:is-open="showImageDeleteDialog"
      :image-name="imageToDelete?.name"
      :is-deleting="isDeletingImage"
      @confirm="confirmImageDelete"
    />

    <ClientOnly>
      <AspectVariantDialog
        v-if="imageActions.aspectVariantDialogImage.value"
        v-model:is-open="imageActions.showAspectVariantDialog.value"
        :image="imageActions.aspectVariantDialogImage.value"
        :variants="imageActions.getAspectVariantsFromLayout(imageActions.aspectVariantDialogImage.value)"
        @update:variants="handleAspectVariantsUpdate"
      />
      <AspectUploadDialog
        v-if="imageActions.aspectUploadParentImage.value"
        v-model:is-open="imageActions.showAspectUploadDialog.value"
        :parent-image="imageActions.aspectUploadParentImage.value"
        @complete="handleAspectUploadComplete"
      />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~~/shared/types/image'
import type { Ref } from 'vue'
import { useGridStore } from '@/stores/useGridStore'
import { useImageUpload } from '~/composables/image/useImageUpload'
import { useImageModal } from '~/composables/image/useImageModal'
import { useImageActions } from '~/composables/image/useImageActions'
import { useAddToCollectionModal } from '~/composables/collection/useAddToCollectionModal'
import { useHomeMultiSelect } from '~/composables/image/useHomeMultiSelect'
import { useHomeKeyboardNav } from '~/composables/image/useHomeKeyboardNav'

const { loggedIn, user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'admin')
const gridStore = useGridStore()
const layout = computed(() => gridStore.layout)
const displayLayout = computed(() =>
  gridStore.layout.filter(img => !img.aspect_group_id)
)
const imageActions = useImageActions()
const imageModal = useImageModal()
const imageUpload = useImageUpload()
const addToCollection = useAddToCollectionModal()
const multiSelect = useHomeMultiSelect()

const route = useRoute()
const { toast } = useToast()
const { showErrorToast } = useErrorToast()

import { watch, nextTick } from 'vue'

const replacementFileInput = imageUpload.replacementFileInput

const imageModalRef = ref<{ focusModal?: () => void } | null>(null)
const hideInitialGridLoading = ref(false)
let initialGridLoadingTimeout: ReturnType<typeof setTimeout> | null = null

const showGrid = ref(false)
const showGridOpacity = ref(false)
const isDraggable = computed(() => loggedIn.value)
const isResizable = computed(() => loggedIn.value && isAdmin.value)
const isInitialGridLoading = computed(() => !gridStore.initialized && !hideInitialGridLoading.value)

const colNum = ref(14)
const rowHeight = ref(37)

// Multi-select dialog states
const showBulkDeleteDialog = ref(false)
const showBulkAddToCollectionDialog = ref(false)
const showImageDeleteDialog = ref(false)
const isDeletingImage = ref(false)
const imageToDelete = ref<Image | null>(null)

// Bulk collections state
const bulkCollections = ref<any[]>([])
const isLoadingBulkCollections = ref(false)
const bulkCollectionsError = ref<string | null>(null)

// Multi-drag: snapshot of selected items' positions before a drag starts
const preDragSnapshot = ref<Record<number, { x: number; y: number }>>({})

const updateRowHeight = () => {
  const windowWidth = window.innerWidth
  if (windowWidth < 640) { rowHeight.value = 8; return; }
  if (windowWidth < 700) { rowHeight.value = 14; return; }
  if (windowWidth < 860) { rowHeight.value = 16; return; }
  if (windowWidth < 990) { rowHeight.value = 20; return; }
  if (windowWidth < 1024) { rowHeight.value = 24; return; }
  if (windowWidth < 1130) { rowHeight.value = 26; return; }
  if (windowWidth < 1350) { rowHeight.value = 28; return; }
  rowHeight.value = 37
}

onMounted(() => {
  // Reset all stale modal state that persists across navigations (module-level singleton)
  imageModal.resetState()

  if (!gridStore.initialized) {
    const loadingStartedAt = Date.now()
    gridStore.fetchGrid().finally(() => {
      const elapsed = Date.now() - loadingStartedAt
      const remaining = Math.max(0, 450 - elapsed)

      if (initialGridLoadingTimeout) {
        clearTimeout(initialGridLoadingTimeout)
      }

      initialGridLoadingTimeout = setTimeout(() => {
        hideInitialGridLoading.value = true
        initialGridLoadingTimeout = null
      }, remaining)
    })
  } else {
    hideInitialGridLoading.value = true
  }
  updateRowHeight()
  window.addEventListener('resize', updateRowHeight)
  window.addEventListener('keydown', keyboardNav.escapeKeyHandler, true)
  window.addEventListener('keydown', keyboardNav.homeKeyboardHandler, true)

  window.addEventListener('dragenter', imageUpload.handleDragEnter)
  window.addEventListener('dragover', imageUpload.handleDragOver)
  window.addEventListener('dragleave', imageUpload.handleDragLeave)
  window.addEventListener('drop', imageUpload.handleDrop)
})

onUnmounted(() => {
  if (initialGridLoadingTimeout) {
    clearTimeout(initialGridLoadingTimeout)
    initialGridLoadingTimeout = null
  }

  window.removeEventListener('resize', updateRowHeight)
  window.removeEventListener('keydown', keyboardNav.escapeKeyHandler, true)
  window.removeEventListener('keydown', keyboardNav.homeKeyboardHandler, true)

  window.removeEventListener('dragenter', imageUpload.handleDragEnter)
  window.removeEventListener('dragover', imageUpload.handleDragOver)
  window.removeEventListener('dragleave', imageUpload.handleDragLeave)
  window.removeEventListener('drop', imageUpload.handleDrop)
})

// Auto-open image dialog from URL query param on page load
let hasAutoOpenedFromQuery = false
watch(() => gridStore.initialized, (initialized) => {
  if (!initialized || hasAutoOpenedFromQuery) return
  const imageSlug = route.query.image as string | undefined
  if (!imageSlug) return
  hasAutoOpenedFromQuery = true
  nextTick(() => {
    const image = layout.value.find(
      img => img.slug === imageSlug || String(img.id) === imageSlug
    )
    if (image) {
      imageModal.openImageModal(image)
    } else {
      const url = new URL(window.location.href)
      url.searchParams.delete('image')
      window.history.replaceState(window.history.state, '', url.toString())
    }
  })
})

const refocusImageModal = () => {
  if (!imageModal.isImageModalOpen.value) return
  nextTick(() => {
    imageModalRef.value?.focusModal?.()
  })
}

watch(() => imageActions.showEditModal.value, (isOpen, wasOpen) => {
  if (!isOpen && wasOpen) {
    refocusImageModal()
  }
})

watch(() => addToCollection.isOpen.value, (isOpen, wasOpen) => {
  if (!isOpen && wasOpen) {
    refocusImageModal()
  }
})

function handleGridDragStart(itemId: number) {
  if (!multiSelect.isSelectionMode.value || multiSelect.selectionCount.value === 0) return
  if (!multiSelect.selectedImagesMap.value[itemId]) return

  const selectedIds = new Set(multiSelect.selectedImageIds.value)
  preDragSnapshot.value = {}
  for (const item of layout.value) {
    if (selectedIds.has(item.id)) {
      preDragSnapshot.value[item.id] = { x: item.x, y: item.y }
    }
  }
}

function layoutUpdated(newLayout: Image[]) {
  if (!loggedIn.value) return

  if (multiSelect.isSelectionMode.value && multiSelect.hasSelectedImages.value) {
    const snapshotKeys = Object.keys(preDragSnapshot.value)
    if (snapshotKeys.length > 0) {
      const selectedIds = new Set(multiSelect.selectedImageIds.value)
      let draggedId: number | null = null
      let dx = 0
      let dy = 0

      for (const item of newLayout) {
        if (!selectedIds.has(item.id)) continue
        const snap = preDragSnapshot.value[item.id]
        if (!snap) continue
        const deltaX = item.x - snap.x
        const deltaY = item.y - snap.y
        if (deltaX !== 0 || deltaY !== 0) {
          draggedId = item.id
          dx = deltaX
          dy = deltaY
          break
        }
      }

      if (draggedId !== null && (dx !== 0 || dy !== 0)) {
        const modifiedLayout = newLayout.map(item => {
          if (selectedIds.has(item.id) && item.id !== draggedId) {
            return { ...item, x: item.x + dx, y: item.y + dy }
          }
          return item
        })
        preDragSnapshot.value = {}
        gridStore.applyIncomingLayout(modifiedLayout)
        gridStore.saveLayout(modifiedLayout)
        return
      }
    }
  }

  preDragSnapshot.value = {}
  gridStore.saveLayout(newLayout)
}

function layoutReady(_layout: Image[]) {
  showGrid.value = true
  setTimeout(() => {
    showGridOpacity.value = true
  }, 250)
}

function handleImageToggle(imageId: number, index: number, event: MouseEvent) {
  multiSelect.handleImageToggle(layout.value, imageId, index, event)
}

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

const handleBulkDownload = async () => {
  const result = await multiSelect.bulkDownloadImages(layout.value)
  if (!result.success) {
    showErrorToast(result.message, 'Download Failed')
    return
  }

  toast({
    title: 'Download Started',
    description: result.message,
    toast: 'soft-success'
  })
}

const openImageDeleteDialog = (image: Image | null) => {
  if (!image || !isAdmin.value) return
  imageToDelete.value = image
  showImageDeleteDialog.value = true
}

const hasOpenModal = computed(() =>
  imageModal.isImageModalOpen.value ||
  imageModal.isImageFullscreenOpen.value ||
  showImageDeleteDialog.value ||
  imageActions.showEditModal.value ||
  addToCollection.isOpen.value ||
  imageActions.showEditDrawer.value ||
  addToCollection.isDrawerOpen.value ||
  showBulkDeleteDialog.value ||
  showBulkAddToCollectionDialog.value
)

const keyboardNav = useHomeKeyboardNav({
  layout,
  isAdmin,
  hasOpenModal,
  imageModal: {
    isImageModalOpen: imageModal.isImageModalOpen,
    isImageFullscreenOpen: imageModal.isImageFullscreenOpen,
    openImageModal: imageModal.openImageModal,
    openImagePage: imageModal.openImagePage,
  },
  imageActions: {
    showEditModal: imageActions.showEditModal,
    showEditDrawer: imageActions.showEditDrawer,
    openEditModal: imageActions.openEditModal,
    downloadImage: imageActions.downloadImage,
    viewImageFullscreen: imageActions.viewImageFullscreen,
    triggerImageReplacement: imageActions.triggerImageReplacement,
    deleteImage: imageActions.deleteImage,
  },
  addToCollection: {
    isOpen: addToCollection.isOpen,
    isDrawerOpen: addToCollection.isDrawerOpen,
    openModal: addToCollection.openModal,
  },
  multiSelect: {
    selectedImagesMap: multiSelect.selectedImagesMap as Ref<Record<number, boolean>>,
    isSelectionMode: multiSelect.isSelectionMode as Ref<boolean>,
    hasSelectedImages: multiSelect.hasSelectedImages,
    toggleImageSelection: multiSelect.toggleImageSelection,
    clearSelection: multiSelect.clearSelection,
    enterSelectionMode: multiSelect.enterSelectionMode,
    toggleSelectionMode: multiSelect.toggleSelectionMode,
    toggleSelectAll: multiSelect.toggleSelectAll,
    selectionCount: multiSelect.selectionCount,
    selectedImageIds: multiSelect.selectedImageIds,
    bulkDeleteImages: multiSelect.bulkDeleteImages,
    bulkAddToCollection: multiSelect.bulkAddToCollection,
    bulkDownloadImages: multiSelect.bulkDownloadImages,
  },
  imageUpload: {
    triggerFileUpload: imageUpload.triggerFileUpload,
  },
  replacementFileInput,
  openImageDeleteDialog,
  openBulkDeleteDialog,
  openBulkAddToCollectionDialog,
})

const confirmImageDelete = async () => {
  if (!imageToDelete.value) return
  isDeletingImage.value = true
  try {
    await imageActions.deleteImage(imageToDelete.value.id)
    showImageDeleteDialog.value = false
    imageToDelete.value = null
    imageModal.closeModal()
  } finally {
    isDeletingImage.value = false
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
      return
    }

    showErrorToast(result.message, 'Delete Failed', result.message)
  } catch (error) {
    console.error('Bulk delete error:', error)
    showErrorToast(error, 'Delete Failed', 'An unexpected error occurred')
  }
}

const handleBulkAddToCollection = async (imageIds: number[], collectionSlug: string) => {
  try {
    const result = await multiSelect.bulkAddToCollection(imageIds, collectionSlug)

    if (result.success) {
      showBulkAddToCollectionDialog.value = false
      toast({
        title: 'Added to Collection',
        description: result.message,
        duration: 3000,
        showProgress: true,
        toast: 'soft-success'
      })
      return
    }

    showErrorToast(result.message, 'Add Failed', result.message)
  } catch (error) {
    console.error('Bulk add to collection error:', error)
    showErrorToast(error, 'Add Failed', 'An unexpected error occurred')
  }
}

const navigateToCreateCollection = () => {
  navigateTo('/collections/create')
}

const handleAspectVariantsUpdate = (variants: Image[]) => {
  if (imageActions.aspectVariantDialogImage.value) {
    imageActions.aspectVariantDialogImage.value.aspect_variants = variants
  }
}

const handleAspectUploadComplete = async () => {
  await gridStore.fetchGrid()
}
</script>

<style scoped>
</style>
