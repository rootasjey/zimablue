<template>
  <div :class="['container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8', store.hasSelectedImages ? 'pb-28 sm:pb-36' : '']">
    <!-- Header (non-sticky). Only the internal action bar stays sticky. -->
    <!-- Header skeleton while loading -->
    <div v-if="store.isLoading" class="space-y-2">
      <div class="h-6 w-52 rounded-md bg-gray-200/60 dark:bg-gray-800/60 animate-pulse"></div>
      <div class="h-4 w-80 rounded-md bg-gray-200/50 dark:bg-gray-800/50 animate-pulse"></div>
    </div>
    
    <CollectionHeader 
      v-else
      :collection="store.collection"
      :image-count="store.images.length"
      :can-edit="isOwner"
      class="animate-fade-in-down"
      @edit="store.openEditDialog"
      @add-images="store.startAddingImages"
      @reorder="store.startReordering"
    />

    <!-- Content -->
    <div class="w-full mx-auto space-y-8">
      <!-- Loading State: grid skeletons -->
      <section v-if="store.isLoading" class="space-y-6">
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 [content-visibility:auto]">
          <div v-for="i in 12" :key="i" class="aspect-[4/3] rounded-xl bg-gray-200/50 dark:bg-gray-800/50 animate-pulse"></div>
        </div>
      </section>

      <!-- Error State -->
      <section v-else-if="store.error" class="py-8">
        <div class="mx-auto max-w-2xl">
          <div class="flex items-start gap-3 rounded-xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3">
            <div class="i-ph-warning-circle text-size-6 text-amber-500 mt-0.5"></div>
            <div class="flex-1">
              <h3 class="text-size-5 font-600 text-gray-800 dark:text-gray-200 mb-1">Something went wrong</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-3">{{ store.error }}</p>
              <NButton size="12px" btn="soft-gray" @click="store.fetchCollection(slug)">Try again</NButton>
            </div>
          </div>
        </div>
      </section>

      <ImageSelectionMode
        v-if="store.isAddingImages"
        :images="store.availableImages"
        :selected-images-map="store.selectedImagesMap"
        :is-all-selected="store.isAllSelected"
        :has-selected-images="store.hasSelectedImages"
        :selection-count="store.selectionCount"
        class="animate-fade-in-up animation-delay-200"
        @toggle-select-all="store.toggleSelectAll"
        @cancel="store.cancelAddingImages"
        @confirm="actions.addImages"
        @toggle-image="store.toggleImageSelection"
        @toggle-image-range="store.toggleImageRange"
        @empty-action="navigateToUpload"
      />

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
        :selected-images-map="store.selectedImagesMap"
        :has-selected-images="store.hasSelectedImages"
        :cover-image-id="store.collection?.cover_image_id"
        :selection-count="store.selectionCount"
        class="animate-fade-in-up animation-delay-200"
        @image-click="openImageModal"
        @set-cover="actions.setAsCover"
        @remove-images="actions.removeImages"
        @clear-selection="store.clearSelection"
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
      <div v-if="store.hasSelectedImages" class="fixed left-0 right-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:bottom-[calc(5.0rem+env(safe-area-inset-bottom))] z-10 pointer-events-none">
        <div class="pointer-events-auto mx-auto max-w-xl px-4">
          <div class="rounded-xl border border-gray-200/60 dark:border-gray-800/60 backdrop-blur bg-white/90 dark:bg-gray-900/90 px-3 py-2 shadow-lg">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm text-gray-600 dark:text-gray-300">
                <span class="font-600">{{ store.selectionCount }}</span> selected
              </div>
              <div class="flex items-center gap-2">
                <NButton size="12px" btn="soft-gray" @click="store.clearSelection">Clear</NButton>
                <NButton
                  v-if="store.isAddingImages"
                  size="12px"
                  btn="soft-blue"
                  @click="actions.addImages"
                >Add</NButton>
                <NButton
                  v-else
                  size="12px"
                  btn="soft-error"
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
    
    <ImageMobileDrawer
      :is-image-drawer-open="isImageDrawerOpen"
      :selected-modal-image="selectedImage"
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
  </div>
</template>

<script lang="ts" setup>
import { useCollectionActions } from '~/composables/collection/useCollectionActions'
import { useImageActions } from '~/composables/image/useImageActions'
import { useAddToCollectionModal } from '~/composables/collection/useAddToCollectionModal'
import { useImageUpload } from '~/composables/image/useImageUpload'
import type { Image } from '~~/shared/types/image'

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const { loggedIn, user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'admin')

const store = useCollectionDetailStore()

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

// Image actions & add-to-collection modal used by the modal menu
const imageActions = useImageActions()
const addToCollection = useAddToCollectionModal()
const imageUpload = useImageUpload()
const replacementFileInput = imageUpload.replacementFileInput
const pageHeader = usePageHeader()
const imageModalRef = ref<{ focusModal?: () => void } | null>(null)

// Computed properties for navigation (circular when more than 1 image)
const canNavigatePrevious = computed(() => store.images.length > 1)
const canNavigateNext = computed(() => store.images.length > 1)

// Load collection data on mount
onMounted(async () => {
  pageHeader.setPageHeader({
    show: false
  })

  try {
    await store.fetchCollection(slug)
  } catch (err) {
    toast({
      title: 'Error',
      description: 'Failed to load collection. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  }
})

// Reset store when component unmounts
onUnmounted(() => {
  pageHeader.resetPageHeader()
  store.resetStore()
})

const navigateToUpload = () => {
  // Navigate to upload page or open upload dialog
  // router.push('/upload')
}

const navigateToPrevious = () => {
  if (!canNavigatePrevious.value) return
  const lastIndex = store.images.length - 1
  currentImageIndex.value = currentImageIndex.value > 0 ? currentImageIndex.value - 1 : lastIndex
  selectedImage.value = store.images[currentImageIndex.value] ?? null
}

const navigateToNext = () => {
  if (!canNavigateNext.value) return
  const lastIndex = store.images.length - 1
  currentImageIndex.value = currentImageIndex.value < lastIndex ? currentImageIndex.value + 1 : 0
  selectedImage.value = store.images[currentImageIndex.value] ?? null
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
const openFullPage = () => {
  if (selectedImage.value) {
    // close modal/drawer before navigating for a smooth UX
    isImageModalOpen.value = false
    isImageDrawerOpen.value = false
    router.push(`/illustrations/${selectedImage.value.slug}`)
  }
}

const openImageModal = (image: Image, event?: MouseEvent | PointerEvent) => {
  selectedImage.value = image
  const idx = store.images.findIndex(img => img.id === image.id)
  currentImageIndex.value = idx > -1 ? idx : 0

  // Detect mobile viewport and open drawer instead of modal
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  if (isMobile) {
    isImageDrawerOpen.value = true
  } else {
    isImageModalOpen.value = true
  }
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

const openImageDeleteDialog = (image: Image | null) => {
  if (!image || !isAdmin.value) return
  imageToDelete.value = image
  showImageDeleteDialog.value = true
}

const confirmImageDelete = async () => {
  if (!imageToDelete.value) return
  isDeletingImage.value = true
  try {
    await imageActions.deleteImage(imageToDelete.value.id)
    showImageDeleteDialog.value = false
    imageToDelete.value = null
    isImageModalOpen.value = false
    isImageDrawerOpen.value = false
  } finally {
    isDeletingImage.value = false
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
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-down {
  animation: fade-in-down 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
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
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
