<template>
  <div :class="['mx-auto max-w-7xl', store.hasSelectedImages ? 'pb-28 sm:pb-36' : '']"
    @dragenter.prevent="!store.isReordering && imageUpload.handleDragEnter($event)"
    @dragover.prevent="!store.isReordering && imageUpload.handleDragOver($event)"
    @dragleave.prevent="!store.isReordering && imageUpload.handleDragLeave($event)"
    @drop.prevent="!store.isReordering && handleDrop($event)"
  >
    <ImageUploadProgress
      :session="imageUpload.currentUploadSession.value"
      @close="imageUpload.clearUploadSession"
    />

    <ImageUploadZone
      :show-empty-state="false"
      :is-dragging="imageUpload.isDragging.value"
      :is-uploading="imageUpload.isUploading.value"
      :logged-in="loggedIn"
      overlay-position="bottom"
      @upload="imageUpload.triggerFileUpload"
    />

    <CollectionHeader
      v-if="!store.isLoading"
      :collection="store.collection"
      :image-count="store.images.length"
      :can-edit="isOwner"
      :cover-image-pathname="coverImagePathname"
      :sticky-top-offset="stickyTopOffset"
      class="animate-fade-in-down"
      @edit="store.openEditDialog"
      @add-images="store.startAddingImages"
      @upload-to-collection="triggerUploadToCollection"
      @reorder="store.startReordering"
      @delete-collection="showCollectionDeleteDialog = true"
      @enter-selection-mode="store.enterSelectionMode"
      @remove-cover="actions.removeCover"
      @set-cover-from-drag="setCoverFromDrag"
    />

    <!-- Content -->
    <div class="w-full px-4 mx-auto space-y-8">
      <!-- Loading State: grid skeletons -->
      <section v-if="store.isLoading" class="space-y-6">
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 [content-visibility:auto]">
          <div v-for="i in 12" :key="i" class="aspect-[4/3] rounded-xl bg-gray-200/50 dark:bg-gray-800/50 animate-pulse"></div>
        </div>
      </section>

      <!-- Error State -->
      <section v-else-if="store.error" class="py-8">
        <div class="mx-auto max-w-2xl">
          <div class="flex items-start gap-3 rounded-xl border border-indigo-300/40 bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-3">
            <div class="i-ph-warning-circle text-size-6 text-indigo-500 mt-0.5"></div>
            <div class="flex-1">
              <h3 class="text-size-5 font-600 text-gray-800 dark:text-gray-200 mb-1">Something went wrong</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">{{ store.error }}</p>
              <NButton size="12px" btn="soft-gray" @click="store.fetchCollection(slug)">Try again</NButton>
            </div>
          </div>
        </div>
      </section>

      <!-- Reordering Mode -->
      <CollectionImageReorderMode
        v-else-if="store.isReordering"
        :images="store.images"
        class="animate-fade-in-up animation-delay-200"
        @cancel="store.cancelReordering"
        @save="actions.saveOrder"
      />

      <CollectionImageGrid
        v-else-if="store.images.length > 0"
        :images="store.images"
        :can-edit="isOwner"
        :collection-stats="{ views: store.collection?.stats_views ?? 0, likes: store.collection?.stats_likes ?? 0 }"
        :cover-image-id="store.collection?.cover_image_id ?? null"
        :selected-images-map="store.selectedImagesMap"
        :has-selected-images="store.hasSelectedImages && !store.isAddImagesDialogOpen"
        :selection-count="store.selectionCount"
        :is-selection-mode="store.isSelectionMode"
        :image-menu-items="collectionImageMenuItems"
        :highlighted-image-index="highlightedImageIndex"
        class="animate-fade-in-up animation-delay-200"
        @image-click="openImageModal"
        @remove-images="actions.removeImages"
        @clear-selection="store.clearSelection"
        @enter-selection-mode="handleEnterSelectionMode"
        @toggle-image="store.toggleImageSelection"
        @set-highlight="setHighlightedImage"
      />

      <EmptyState
        v-if="!store.isLoading && !store.error && store.images.length === 0"
        :show-action="isOwner"
        variant="collection"
        class="animate-fade-in-up animation-delay-200"
        @action="store.startAddingImages"
      />
    </div>

    <!-- Sticky Selection Toolbar with entrance animation -->
    <Transition name="toolbar-fade-slide">
      <div v-if="store.isSelectionMode && store.hasSelectedImages && !store.isAddImagesDialogOpen" class="fixed left-0 right-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:bottom-[calc(5.0rem+env(safe-area-inset-bottom))] z-10 pointer-events-none">
        <div class="pointer-events-auto mx-auto max-w-xl px-4">
          <div class="rounded-xl border border-gray-200/60 dark:border-gray-800/60 backdrop-blur bg-white/90 dark:bg-gray-900/90 px-3 py-2 shadow-lg">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm text-gray-600 dark:text-gray-300">
                <span class="font-600">{{ store.selectionCount }}</span> selected
              </div>
              <div class="flex items-center gap-2">
                <NButton size="12px" btn="soft-gray" @click="store.exitSelectionMode">Exit</NButton>
                <NButton
                  size="12px"
                  btn="soft-blue"
                  :disabled="store.selectionCount === 0"
                  @click="openBulkAddToCollection"
                >Add to collection</NButton>
                <NButton
                  size="12px"
                  btn="soft-error"
                  :disabled="store.selectionCount === 0"
                  @click="actions.removeImages"
                >Remove</NButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <CollectionEditDialog
      v-model:open="store.isEditDialogOpen"
      :collection="store.collection"
      @update="actions.updateCollection"
      @delete="actions.deleteCollection"
      @cancel="store.closeEditDialog"
    />

    <ImageAddImagesToCollectionDialog
      v-model:is-open="store.isAddImagesDialogOpen"
      :images="store.availableImages"
      :selected-images-map="store.selectedImagesMap"
      :is-all-selected="store.isAllSelected"
      :has-selected-images="store.hasSelectedImages"
      :selection-count="store.selectionCount"
      :collection-name="store.collection?.name || 'Collection'"
      @toggle-select-all="store.toggleSelectAll"
      @clear-selection="store.clearSelection"
      @confirm="actions.addImages"
      @toggle-image="store.toggleImageSelection"
      @toggle-image-range="store.toggleImageRange"
    />

    <ImageModal
      ref="imageModalRef"
      :is-image-modal-open="isImageModalOpen"
      :selected-modal-image="selectedImage"
      :current-position="currentImageIndex + 1"
      :total-images="store.images.length"
      :can-navigate-previous="canNavigatePrevious"
      :can-navigate-next="canNavigateNext"
      @update-image-modal-open="onUpdateImageModalOpen"
      @navigate-previous="navigateToPrevious"
      @navigate-next="navigateToNext"
      @navigate-to-first="navigateToFirst"
      @navigate-to-last="navigateToLast"
      :image-menu-items="(item: Image) => imageActions.generateImageMenuItems({
        image: item,
        openImagePageFn: openFullPage,
        openAddToCollectionModalFn: addToCollection.openModal,
        replacementFileInput,
      })"
      @open-full-page="openFullPage"
      @open-edit-modal="(img: Image) => imageActions.openEditModal(img)"
      @open-add-to-collection-modal="(img: Image) => addToCollection.openModal(img)"
      @replace-image="(img: Image) => imageActions.triggerImageReplacement(img, replacementFileInput)"
      @download-image="(img: Image) => imageActions.downloadImage(img)"
      @request-delete="(img: Image) => openImageDeleteDialog(img)"
    />

    <!-- Image edit modal (was missing) - re-use the same imageActions composable as index.vue -->
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
      :filtered-collections="addToCollection.filteredCollections.value"
      :selected-collections="addToCollection.selectedCollections.value"
      :search-query="addToCollection.searchQuery.value"
      :is-loading="addToCollection.isLoading.value"
      :is-adding="addToCollection.isAdding.value"
      :error="addToCollection.error.value"
      @add-to-collection="addToCollection.addImageToCollection"
      @toggle-collection="addToCollection.toggleCollection"
      @toggle-select-all="addToCollection.toggleSelectAll"
      @update:search-query="addToCollection.searchQuery.value = $event"
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
      :filtered-collections="addToCollection.filteredCollections.value"
      :selected-collections="addToCollection.selectedCollections.value"
      :search-query="addToCollection.searchQuery.value"
      :is-loading="addToCollection.isLoading.value"
      :is-adding="addToCollection.isAdding.value"
      :error="addToCollection.error.value"
      @add-to-collection="addToCollection.addImageToCollection"
      @toggle-collection="addToCollection.toggleCollection"
      @update:search-query="addToCollection.searchQuery.value = $event"
    />

    <ImageMobileDrawer
      :is-image-drawer-open="isImageDrawerOpen"
      :selected-modal-image="selectedImage"
      :prev-image="prevImage"
      :next-image="nextImage"
      :current-position="currentImageIndex + 1"
      :total-images="store.images.length"
      :can-navigate-previous="canNavigatePrevious"
      :can-navigate-next="canNavigateNext"
      :image-menu-items="(item: Image) => imageActions.generateImageMenuItems({
        image: item,
        openImagePageFn: openFullPage,
        openAddToCollectionModalFn: addToCollection.openModal,
        replacementFileInput,
      })"
      @open-full-page="openFullPage"
      @navigate-previous="navigateToPrevious"
      @navigate-next="navigateToNext"
      @update-image-drawer-open="onUpdateImageDrawerOpen"
      @open-edit-drawer="(img: Image) => imageActions.openEditDrawer(img)"
      @open-add-to-collection-drawer="(img: Image) => addToCollection.openDrawer(img)"
      @replace-image="(img: Image) => imageActions.triggerImageReplacement(img, replacementFileInput)"
      @request-delete="(img: Image) => openImageDeleteDialog(img)"
    />

    <ImageDeleteDialog
      v-model:is-open="showImageDeleteDialog"
      :image-name="imageToDelete?.name"
      :is-deleting="isDeletingImage"
      @confirm="confirmImageDelete"
    />

    <CollectionDeleteDialog
      v-model:open="showCollectionDeleteDialog"
      :collection="store.collection"
      @delete="actions.deleteCollection"
    />

    <ImageBulkAddToCollectionDialog
      v-model:is-open="showBulkAddToCollectionDialog"
      :image-count="selectedImageIds.length"
      :selected-image-ids="selectedImageIds"
      :collections="collectionsForBulkAdd"
      :is-loading-collections="addToCollection.isLoading.value"
      @confirm="handleBulkAddToCollection"
    />

    <input
      ref="collectionFileInput"
      type="file"
      class="hidden"
      accept="image/*"
      multiple
      @change="handleCollectionFileSelect"
    />
  </div>
</template>

<script lang="ts" setup>
import { useCollectionActions } from '~/composables/collection/useCollectionActions'
import { useImageActions } from '~/composables/image/useImageActions'
import { useAddToCollectionModal } from '~/composables/collection/useAddToCollectionModal'
import { useImageUpload } from '~/composables/image/useImageUpload'
import type { Image } from '~~/shared/types/image'

definePageMeta({
  disableViewTransition: true,
})

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const { showErrorToast } = useErrorToast()
const { loggedIn, user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'admin')

const store = useCollectionDetailStore()

// Dynamic SEO meta based on collection data
const collectionTitle = computed(() => store.collection?.name || 'Collection')
const collectionDesc = computed(() => store.collection?.description || 'Explore this curated collection of digital illustrations')
const config = useRuntimeConfig()
const firstImagePath = computed(() => {
  const firstImage = store.images?.[0]
  if (!firstImage) return undefined
  const p = firstImage.pathname
  return p.startsWith('/') ? p : `/${p}`
})

useSeoMeta({
  title: collectionTitle,
  description: collectionDesc,
  ogTitle: () => `${collectionTitle.value} — Zima Blue`,
  ogDescription: collectionDesc,
  ogImage: () => firstImagePath.value ? `${config.public.siteUrl}/images${firstImagePath.value}` : undefined,
  twitterTitle: () => `${collectionTitle.value} — Zima Blue`,
  twitterDescription: collectionDesc,
  twitterImage: () => firstImagePath.value ? `${config.public.siteUrl}/images${firstImagePath.value}` : undefined,
})

defineOgImageComponent('Collection.takumi', {
  title: () => collectionTitle.value,
  description: () => collectionDesc.value,
  imageCount: () => store.images?.length || 0,
})

// Ensure we render a loading state on first render when the store
// doesn't yet have collection data. This prevents a brief flash of the
// empty state ("nothing here yet") before fetchCollection runs.
if (!store.collection && store.images.length === 0) {
  store.isLoading = true
}
const slug = route.params.slug as string

// Initialize actions composable
const actions = useCollectionActions({
  store,
  slug,
})

// Check if user is the owner of the collection or an admin
const isOwner = computed(() => {
  if (!loggedIn.value || !store.collection) return false
  // Admins can edit any collection
  if (user.value?.role === 'admin') return true
  // Regular users can only edit their own collections
  if (!store.collection.owner) return false
  return store.collection.owner.id === user.value?.id
})

const isImageModalOpen = ref(false)
const isImageDrawerOpen = ref(false)
const showImageDeleteDialog = ref(false)
const isDeletingImage = ref(false)
const imageToDelete = ref<Image | null>(null)
const selectedImage = ref<Image | null>(null)
const currentImageIndex = ref(0)
const showCollectionDeleteDialog = ref(false)
const showBulkAddToCollectionDialog = ref(false)
const highlightedImageIndex = ref(-1)

const getGridColumns = (): number => {
  if (typeof window === 'undefined') return 5
  return window.innerWidth >= 768 ? 5 : 3
}

const setHighlightedImage = (index: number) => {
  highlightedImageIndex.value = index
}

watch(() => highlightedImageIndex.value, (newIndex) => {
  if (newIndex < 0) return
  nextTick(() => {
    const gridEl = document.querySelector('[data-collection-grid]')
    if (!gridEl) return
    const card = gridEl.children[newIndex] as HTMLElement
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  })
})

watch(() => store.images.length, () => {
  if (store.images.length === 0) {
    highlightedImageIndex.value = -1
  } else if (highlightedImageIndex.value >= store.images.length) {
    highlightedImageIndex.value = store.images.length - 1
  }
})

// --- Query param sync ---
const IMAGE_QUERY_KEY = 'image'

const syncImageQueryParam = (slug?: string) => {
  if (typeof window === 'undefined') return
  const currentImageParam = route.query[IMAGE_QUERY_KEY] as string | undefined
  if ((slug || undefined) === currentImageParam) return
  const url = new URL(window.location.href)
  if (slug) {
    url.searchParams.set(IMAGE_QUERY_KEY, slug)
  } else {
    url.searchParams.delete(IMAGE_QUERY_KEY)
  }
  window.history.replaceState(window.history.state, '', url.toString())
}

watch([isImageModalOpen, isImageDrawerOpen], ([modal, drawer]) => {
  if (!modal && !drawer) {
    syncImageQueryParam()
  }
})
// --- End query param sync ---

// Image actions & add-to-collection modal used by the modal menu
const imageActions = useImageActions()
const addToCollection = useAddToCollectionModal()
const imageUpload = useImageUpload()
const replacementFileInput = imageUpload.replacementFileInput
const collectionFileInput = ref<HTMLInputElement>()
const pageHeader = usePageHeader()

const imageModalRef = ref<{ focusModal?: () => void } | null>(null)
const gridStore = useGridStore()

const coverImagePathname = computed(() => {
  if (!store.collection?.cover_image_id) return undefined
  const cover = store.images.find(img => img.id === store.collection?.cover_image_id)
  return cover?.pathname
})

const stickyTopOffset = computed(() => {
  if (typeof window === 'undefined') return 56
  return window.innerWidth >= 640 ? 56 : 0
})

// Per-image dropdown menu items for the collection grid (normal mode)
const collectionImageMenuItems = (image: Image) => {
  const coverId = store.collection?.cover_image_id
  const isCover = coverId != null && coverId === image.id

  const items: Array<Record<string, any>> = [
    ...(!store.isSelectionMode
      ? [{
          label: 'Select',
          onClick: () => {
            store.enterSelectionMode()
            nextTick(() => store.toggleImageSelection(image.id))
          },
        }]
      : []),
    {
      label: isCover ? 'Cover image' : 'Set as cover',
      disabled: isCover,
      onClick: () => {
        if (!isCover) actions.setAsCover(image.id)
      },
    },
    ...(isCover
      ? [{
          label: 'Remove cover',
          onClick: () => actions.removeCover(),
        }]
      : []),
    {
      label: 'Remove from collection',
      onClick: () => actions.removeSingleImage(image.id),
    },
    {},
  ]

  const standardItems = imageActions.generateImageMenuItems({
    image,
    openImagePageFn: openFullPage,
    openAddToCollectionModalFn: (img: Image) => addToCollection.openModal(img),
    replacementFileInput: replacementFileInput.value,
  }).map((item: any) => {
    if (item.label === 'Delete') {
      return {
        ...item,
        onClick: () => openImageDeleteDialog(image),
      }
    }
    return item
  })

  items.push(...standardItems)
  return items
}

const handleEnterSelectionMode = (imageId: number) => {
  store.enterSelectionMode()
  const idx = store.images.findIndex(img => img.id === imageId)
  if (idx >= 0) {
    highlightedImageIndex.value = idx
  }
  nextTick(() => {
    store.selectedImagesMap[imageId] = true
  })
}

const collectionsForBulkAdd = computed(() =>
  addToCollection.collections.value.filter((c: any) => c.slug !== slug)
)

const openBulkAddToCollection = async () => {
  if (selectedImageIds.value.length === 0) return
  addToCollection.refreshCollections()
  showBulkAddToCollectionDialog.value = true
}

const handleBulkAddToCollection = async (imageIds: number[], targetSlug: string) => {
  showBulkAddToCollectionDialog.value = false
  const result = await actions.addImagesToAnotherCollection(imageIds, targetSlug)
  if (result?.success) {
    store.exitSelectionMode()
  }
}

// Computed properties for navigation (circular when more than 1 image)
const canNavigatePrevious = computed(() => store.images.length > 1)
const canNavigateNext = computed(() => store.images.length > 1)

const prevImage = computed(() => {
  if (store.images.length <= 1) return null
  const idx = currentImageIndex.value > 0
    ? currentImageIndex.value - 1
    : store.images.length - 1
  return store.images[idx] ?? null
})

const nextImage = computed(() => {
  if (store.images.length <= 1) return null
  const idx = currentImageIndex.value < store.images.length - 1
    ? currentImageIndex.value + 1
    : 0
  return store.images[idx] ?? null
})

const selectedImageIds = computed(() =>
  Object.entries(store.selectedImagesMap)
    .filter(([_, selected]) => selected)
    .map(([id]) => parseInt(id))
)

onMounted(async () => {
  pageHeader.setPageHeader({ disableMobileHeader: true })

  try {
    await store.fetchCollection(slug)
  } catch (err) {
    showErrorToast(err, 'Error', 'Failed to load collection. Please try again.')
  }
  window.addEventListener('keydown', escapeKeyHandler, true)
  window.addEventListener('keydown', collectionKeyboardHandler, true)
})

// Auto-open image dialog from URL query param on page load
let hasAutoOpenedFromQuery = false
watch(() => store.isLoading, (isLoading, wasLoading) => {
  if (isLoading || hasAutoOpenedFromQuery) return
  const imageSlug = route.query.image as string | undefined
  if (!imageSlug) return
  hasAutoOpenedFromQuery = true
  nextTick(() => {
    const image = store.images.find(
      img => img.slug === imageSlug || String(img.id) === imageSlug
    )
    if (image) {
      openImageModal(image)
    } else {
      const url = new URL(window.location.href)
      url.searchParams.delete('image')
      window.history.replaceState(window.history.state, '', url.toString())
    }
  })
})

const searchStore = useGlobalSearchStore()

const escapeKeyHandler = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (searchStore.isDialogOpen) return

    const hasOpenModal =
      isImageModalOpen.value ||
      isImageDrawerOpen.value ||
      showImageDeleteDialog.value ||
      imageActions.showEditModal.value ||
      addToCollection.isOpen.value ||
      imageActions.showEditDrawer.value ||
      addToCollection.isDrawerOpen.value ||
      store.isEditDialogOpen ||
      store.isAddImagesDialogOpen ||
      showCollectionDeleteDialog.value ||
      showBulkAddToCollectionDialog.value

    if (!hasOpenModal) {
      if (highlightedImageIndex.value >= 0) {
        highlightedImageIndex.value = -1
        return
      }
      if (store.isSelectionMode && store.hasSelectedImages) {
        store.exitSelectionMode()
        return
      }
      router.back()
    }
  }
}

const collectionKeyboardHandler = (e: KeyboardEvent) => {
  if (!isOwner.value) return

  const target = e.target as HTMLElement
  const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

  if (isInput) return

  const hasOpenModal =
    isImageModalOpen.value ||
    isImageDrawerOpen.value ||
    showImageDeleteDialog.value ||
    imageActions.showEditModal.value ||
    addToCollection.isOpen.value ||
    imageActions.showEditDrawer.value ||
    addToCollection.isDrawerOpen.value ||
    store.isEditDialogOpen ||
    store.isAddImagesDialogOpen ||
    showCollectionDeleteDialog.value ||
    showBulkAddToCollectionDialog.value

  if (hasOpenModal) return

  // Cmd/Ctrl+A: always enter selection mode + select all
  if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    if (!store.isSelectionMode) {
      store.enterSelectionMode()
    }
    store.toggleSelectAll()
    return
  }

  const hasHighlighted = highlightedImageIndex.value >= 0

  // Block collection-level shortcuts when in reorder mode (except R to exit)
  if (store.isReordering) {
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault()
      store.cancelReordering()
    }
    return
  }

  if (hasHighlighted) {
    // Allow Cmd/Ctrl+R to reload the page
    if ((e.key === 'r' || e.key === 'R') && (e.ctrlKey || e.metaKey)) return

    const gridCols = getGridColumns()
    const totalImages = store.images.length
    const currentIndex = highlightedImageIndex.value

    // Arrow key navigation
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        const rightCol = currentIndex % gridCols
        if (rightCol < gridCols - 1 && currentIndex + 1 < totalImages) {
          highlightedImageIndex.value = currentIndex + 1
        }
        return
      case 'ArrowLeft':
        e.preventDefault()
        const leftCol = currentIndex % gridCols
        if (leftCol > 0 && currentIndex - 1 >= 0) {
          highlightedImageIndex.value = currentIndex - 1
        }
        return
      case 'ArrowDown':
        e.preventDefault()
        if (currentIndex + gridCols < totalImages) {
          highlightedImageIndex.value = currentIndex + gridCols
        }
        return
      case 'ArrowUp':
        e.preventDefault()
        if (currentIndex - gridCols >= 0) {
          highlightedImageIndex.value = currentIndex - gridCols
        }
        return
    }

    // Space: toggle selection of highlighted image
    if (e.key === ' ') {
      e.preventDefault()
      store.toggleHighlightedImageSelection()
      return
    }

    // Enter: open image modal
    if (e.key === 'Enter') {
      e.preventDefault()
      const highlightedImage = store.images[highlightedImageIndex.value]
      if (highlightedImage) {
        openImageModal(highlightedImage)
      }
      return
    }

    // Escape is handled by escapeKeyHandler

    // Image-specific actions (only when NOT in selection mode)
    if (!store.isSelectionMode) {
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        const img = store.images[highlightedImageIndex.value]
        if (img) imageActions.openEditModal(img)
        return
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        const img = store.images[highlightedImageIndex.value]
        if (img) actions.removeSingleImage(img.id)
        return
      }

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        const img = store.images[highlightedImageIndex.value]
        if (img) imageActions.downloadImage(img)
        return
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        const img = store.images[highlightedImageIndex.value]
        if (img) imageActions.viewImageFullscreen(img, openFullPage)
        return
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        const img = store.images[highlightedImageIndex.value]
        if (img) addToCollection.openModal(img)
        return
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        const img = store.images[highlightedImageIndex.value]
        if (img) actions.setAsCover(img.id)
        return
      }

      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault()
        const img = store.images[highlightedImageIndex.value]
        if (img) imageActions.triggerImageReplacement(img, replacementFileInput.value)
        return
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        const img = store.images[highlightedImageIndex.value]
        if (img) openImageDeleteDialog(img)
        return
      }
    } else {
      // Selection mode specific actions
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        actions.removeImages()
        return
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        openBulkAddToCollection()
        return
      }
    }

    // M key works in both modes
    if (e.key === 'm' || e.key === 'M') {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        store.toggleSelectionMode()
      }
      return
    }

    return
  }

  // NOT highlighted: collection-level shortcuts
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    if (store.images.length > 0) {
      highlightedImageIndex.value = 0
    }
    return
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    if (store.images.length > 0) {
      highlightedImageIndex.value = store.images.length - 1
    }
    return
  }

  if (e.key === 'a' || e.key === 'A') {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      store.startAddingImages()
    }
    return
  }

  if (e.key === 'e' || e.key === 'E') {
    e.preventDefault()
    store.openEditDialog()
    return
  }

  if (e.key === 'd' || e.key === 'D') {
    e.preventDefault()
    showCollectionDeleteDialog.value = true
    return
  }

  if (e.key === 'r' || e.key === 'R') {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (store.isReordering) {
        store.cancelReordering()
      } else {
        store.startReordering()
      }
    }
    return
  }

  if (e.key === 'u' || e.key === 'U') {
    e.preventDefault()
    triggerUploadToCollection()
    return
  }

  if (e.key === 'm' || e.key === 'M') {
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      store.toggleSelectionMode()
    }
    return
  }
}

onUnmounted(() => {
  window.removeEventListener('keydown', escapeKeyHandler, true)
  window.removeEventListener('keydown', collectionKeyboardHandler, true)
  pageHeader.resetPageHeader()
  store.resetStore()
})

const navigateToPrevious = () => {
  if (!canNavigatePrevious.value) return
  const lastIndex = store.images.length - 1
  currentImageIndex.value = currentImageIndex.value > 0 ? currentImageIndex.value - 1 : lastIndex
  const prev = store.images[currentImageIndex.value] ?? null
  if (prev) {
    selectedImage.value = prev
    syncImageQueryParam(prev.slug || String(prev.id))
  }
}

const navigateToNext = () => {
  if (!canNavigateNext.value) return
  const lastIndex = store.images.length - 1
  currentImageIndex.value = currentImageIndex.value < lastIndex ? currentImageIndex.value + 1 : 0
  const next = store.images[currentImageIndex.value] ?? null
  if (next) {
    selectedImage.value = next
    syncImageQueryParam(next.slug || String(next.id))
  }
}

const navigateToFirst = () => {
  if (store.images.length === 0) return
  currentImageIndex.value = 0
  selectedImage.value = store.images[currentImageIndex.value] ?? null
}

const navigateToLast = () => {
  if (store.images.length === 0) return
  currentImageIndex.value = store.images.length - 1
  selectedImage.value = store.images[currentImageIndex.value] ?? null
}

// Add this new method for the ImageModal component
const openFullPage = (img?: Image) => {
  const item = img || selectedImage.value
  if (!item) return

  syncImageQueryParam() // clean up query param before navigating away
  isImageModalOpen.value = false
  isImageDrawerOpen.value = false

  gridStore.selectedImage = item

  const urlPath = item.slug
    ? `/illustrations/${item.slug}`
    : `/illustrations/${item.id}`

  const routePayload = {
    path: urlPath,
    state: {
      imageData: JSON.parse(JSON.stringify(item)),
      previousPath: router.currentRoute.value.fullPath
    }
  }

  if (typeof document === 'undefined' || typeof document.startViewTransition !== 'function') {
    router.push(routePayload)
    return
  }

  document.startViewTransition(async () => {
    await router.push(routePayload)
  })
}

const openImageModal = (image: Image, event?: MouseEvent | PointerEvent) => {
  const idx = store.images.findIndex(img => img.id === image.id)
  highlightedImageIndex.value = idx > -1 ? idx : -1
  selectedImage.value = image
  currentImageIndex.value = idx > -1 ? idx : 0

  // Detect mobile viewport and open drawer instead of modal
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  if (isMobile) {
    isImageDrawerOpen.value = true
  } else {
    isImageModalOpen.value = true
  }

  syncImageQueryParam(image.slug || String(image.id))
}

const onUpdateImageModalOpen = (value: boolean) => {
  isImageModalOpen.value = value
}

const onUpdateImageDrawerOpen = (value: boolean) => {
  isImageDrawerOpen.value = value
}

const refocusImageModal = () => {
  if (!isImageModalOpen.value) return
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

watch(
  [() => imageActions.showEditModal.value, () => imageActions.showEditDrawer.value],
  ([modalOpen, drawerOpen], [modalWasOpen, drawerWasOpen]) => {
    const wasOpen = modalWasOpen || drawerWasOpen
    const isNowOpen = modalOpen || drawerOpen
    if (wasOpen && !isNowOpen && gridStore.selectedImage) {
      store.updateImageInCollection(gridStore.selectedImage)
    }
  }
)

const openImageDeleteDialog = (image: Image | null) => {
  if (!image || !isAdmin.value) return
  imageToDelete.value = image
  showImageDeleteDialog.value = true
}

const confirmImageDelete = async () => {
  if (!imageToDelete.value) return
  isDeletingImage.value = true
  try {
    const deletedId = imageToDelete.value.id
    await imageActions.deleteImage(deletedId)
    store.removeDeletedImage(deletedId)
    showImageDeleteDialog.value = false
    imageToDelete.value = null
    isImageModalOpen.value = false
    isImageDrawerOpen.value = false
  } finally {
    isDeletingImage.value = false
  }
}

const setCoverFromDrag = (imageId: number) => {
  actions.setAsCover(imageId)
}

const triggerUploadToCollection = () => {
  if (!imageUpload.checkAuth()) return
  collectionFileInput.value?.click()
}

const handleCollectionFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const files = Array.from(input.files).filter(file =>
    file.type.startsWith('image/') && imageUpload.validateFile(file)
  )

  if (files.length === 0) {
    toast({
      title: 'No Valid Files',
      description: 'No valid image files were found.',
      toast: 'soft-warning',
      showProgress: true,
    })
    return
  }

  try {
    const results = await imageUpload.uploadFiles(files)
    if (!results) return

    const successfulUploads = results.successful
      .filter((r) => r.response?.id != null)
      .map((r) => r.response)

    if (successfulUploads.length > 0) {
      await $fetch(`/api/collections/${slug}`, {
        method: 'PUT',
        body: {
          images: {
            add: successfulUploads.map((img) => img.id)
          }
        }
      })

      store.addImageObjects(successfulUploads)
    }
  } catch (error) {
    console.error('Upload to collection error:', error)
    showErrorToast(error, 'Upload Failed', 'Failed to upload and add images to collection.')
  }

  input.value = ''
}

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  imageUpload.handleDragLeave(e)

  if (!e.dataTransfer) return
  if (!e.dataTransfer.types.includes('Files')) return

  if (!imageUpload.checkAuth()) return

  const allFiles = await imageUpload.readFilesFromDataTransfer(e.dataTransfer)
  const files = allFiles.filter(file =>
    file.type.startsWith('image/') && imageUpload.validateFile(file)
  )

  if (files.length === 0) {
    toast({
      title: 'No Valid Files',
      description: 'No valid image files were found.',
      toast: 'soft-warning',
      showProgress: true,
    })
    return
  }

  try {
    const results = await imageUpload.uploadFiles(files)
    if (!results) return

    const successfulUploads = results.successful
      .filter((r) => r.response?.id != null)
      .map((r) => r.response)

    if (successfulUploads.length > 0) {
      await $fetch(`/api/collections/${slug}`, {
        method: 'PUT',
        body: {
          images: {
            add: successfulUploads.map((img) => img.id)
          }
        }
      })

      store.addImageObjects(successfulUploads)
    }
  } catch (error) {
    console.error('Collection drop upload error:', error)
    showErrorToast(error, 'Upload Failed', 'Failed to upload and add images to collection.')
  }
}
</script>

<style scoped>
/* Entrance animations */
@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
}

.animate-fade-in-down {
  animation: fade-in-down 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
  opacity: 1;
  transform: none;
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
  opacity: 1;
  transform: none;
}

.animation-delay-200 {
  animation-delay: 200ms;
}

/* Toolbar entrance animation */
.toolbar-fade-slide-enter-active,
.toolbar-fade-slide-leave-active {
  transition: opacity 220ms cubic-bezier(.4,0,.2,1), transform 320ms cubic-bezier(.4,0,.2,1);
}
.toolbar-fade-slide-enter-from,
.toolbar-fade-slide-leave-to {
  opacity: 0;
  transform: translateY(32px);
}
.toolbar-fade-slide-enter-to,
.toolbar-fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.i-ph-sun-horizon,
.i-line-md\:moon-to-sunny-outline-loop-transition {
  animation: fadeScale 0.3s ease-in-out;
}

@keyframes fadeScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
}
</style>
