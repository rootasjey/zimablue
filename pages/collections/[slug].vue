<template>
  <div class="frame">
    <CollectionHeader 
      :collection="store.collection"
      :image-count="store.images.length"
      :can-edit="isOwner"
      @edit="store.openEditDialog"
      @add-images="store.startAddingImages"
      @reorder="store.startReordering"
    />

    <!-- Content -->
    <div class="w-full mx-auto">
      <!-- Loading State -->
      <section v-if="store.isLoading" class="flex justify-center items-center py-12">
        <div class="i-line-md:loading-twotone-loop w-12 h-12 text-gray-400 dark:text-gray-600"></div>
      </section>

      <!-- Error State -->
      <section v-else-if="store.error" class="text-center py-12">
        <div class="i-ph-warning-circle text-size-16 text-amber-500 mx-auto mb-4"></div>
        <h3 class="text-size-12 font-semibold mb-2 text-gray-800 dark:text-gray-200">
          Something went wrong
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ store.error }}
        </p>
        <UButton @click="store.fetchCollection(slug)">Try Again</UButton>
      </section>

      <ImageSelectionMode
        v-if="store.isAddingImages"
        :images="store.availableImages"
        :selected-images-map="store.selectedImagesMap"
        :is-all-selected="store.isAllSelected"
        :has-selected-images="store.hasSelectedImages"
        :selection-count="store.selectionCount"
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
        @image-click="openImageModal"
        @set-cover="actions.setAsCover"
        @remove-images="actions.removeImages"
        @clear-selection="store.clearSelection"
      />

      <EmptyState
        v-if="!store.isLoading && !store.error && store.images.length === 0"
        :show-action="isOwner"
        variant="collection"
        @action="store.startAddingImages"
      />
    </div>

    <Footer class="mt-34" />

    <CollectionEditDialog
      v-model:open="store.isEditDialogOpen"
      :collection="store.collection"
      @update="actions.updateCollection"
      @delete="actions.deleteCollection"
      @cancel="store.closeEditDialog"
    />

    <ImageModal
      :is-image-modal-open="isImageModalOpen"
      :selected-modal-image="selectedImage"
      :current-position="currentImageIndex + 1"
      :total-images="store.images.length"
      :can-navigate-previous="canNavigatePrevious"
      :can-navigate-next="canNavigateNext"
      :show-edit-modal="false"
      :edit-form="{ name: '', description: '', slug: '', tags: [] }"
      :available-tags="[]"
      :is-updating="false"
      :is-edit-form-valid="false"
      @update-image-modal-open="isImageModalOpen = $event"
      @navigate-previous="navigateToPrevious"
      @navigate-next="navigateToNext"
      @open-full-page="openFullPage"
    />
  </div>
</template>

<script lang="ts" setup>
import { useCollectionActions } from '~/composables/collection/useCollectionActions'
import type { Image } from '~/types/image'

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const { loggedIn, user } = useUserSession()

// Initialize the store
const store = useCollectionDetailStore()
const slug = route.params.slug as string

// Initialize actions composable
const actions = useCollectionActions({
  store,
  slug,
})

// Check if user is the owner of the collection
const isOwner = computed(() => {
  if (!loggedIn.value || !store.collection || !store.collection.owner) return false
  return store.collection.owner.id === user.value?.id
})

const isImageModalOpen = ref(false)
const selectedImage = ref<Image | null>(null)
const currentImageIndex = ref(0)

// Computed properties for navigation
const canNavigatePrevious = computed(() => currentImageIndex.value > 0)
const canNavigateNext = computed(() => currentImageIndex.value < store.images.length - 1)

// Load collection data on mount
onMounted(async () => {
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

// Keyboard navigation
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (!isImageModalOpen.value) return
    
    if (e.key === 'ArrowLeft') {
      navigateToPrevious()
    } else if (e.key === 'ArrowRight') {
      navigateToNext()
    } else if (e.key === 'Escape') {
      isImageModalOpen.value = false
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})

// Reset store when component unmounts
onUnmounted(() => {
  store.resetStore()
})

const navigateToUpload = () => {
  // Navigate to upload page or open upload dialog
  // router.push('/upload')
}

// Modal methods
const openImageModal = (image: any) => {
  selectedImage.value = image
  currentImageIndex.value = store.images.findIndex(img => img.id === image.id)
  isImageModalOpen.value = true
}

const navigateToPrevious = () => {
  if (canNavigatePrevious.value) {
    currentImageIndex.value--
    selectedImage.value = store.images[currentImageIndex.value]
  }
}

const navigateToNext = () => {
  if (canNavigateNext.value) {
    currentImageIndex.value++
    selectedImage.value = store.images[currentImageIndex.value]
  }
}
// Add this new method for the ImageModal component
const openFullPage = () => {
  if (selectedImage.value) {
    router.push(`/illustrations/${selectedImage.value.slug}`)
  }
}

</script>

<style scoped>
.frame {
  width: 600px;
  border-radius: 0.75rem;
  padding: 2rem;
  padding-bottom: 38vh;
  display: flex;
  flex-direction: column;
  transition-property: all;
  transition-duration: 500ms;
  overflow-y: auto;
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

/* Responsive adjustments */
@media (max-width: 840px) {
  .frame {
    width: 100%;
    border-radius: 0;
    padding: 1.5rem;
  }
}

@media (max-width: 640px) {
  .frame {
    padding: 1rem;
  }
}
</style>
