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
              <UButton size="12px" btn="soft-gray" @click="store.fetchCollection(slug)">Try again</UButton>
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
                <UButton size="12px" btn="soft-gray" @click="store.clearSelection">Clear</UButton>
                <UButton
                  v-if="store.isAddingImages"
                  size="12px"
                  btn="soft-blue"
                  @click="actions.addImages"
                >Add</UButton>
                <UButton
                  v-else
                  size="12px"
                  btn="soft-error"
                  @click="actions.removeImages"
                >Remove</UButton>
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
      @update-image-modal-open="onUpdateImageModalOpen"
      @navigate-previous="navigateToPrevious"
      @navigate-next="navigateToNext"
      @navigate-to-first="navigateToFirst"
      @navigate-to-last="navigateToLast"
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
  withViewTransition(() => {
    selectedImage.value = image
    currentImageIndex.value = store.images.findIndex(img => img.id === image.id)
    isImageModalOpen.value = true
  })
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

const navigateToFirst = () => {
  if (store.images.length === 0) return
  currentImageIndex.value = 0
  selectedImage.value = store.images[currentImageIndex.value]
}

const navigateToLast = () => {
  if (store.images.length === 0) return
  currentImageIndex.value = store.images.length - 1
  selectedImage.value = store.images[currentImageIndex.value]
}

// Add this new method for the ImageModal component
const openFullPage = () => {
  if (selectedImage.value) {
    router.push(`/illustrations/${selectedImage.value.slug}`)
  }
}

// Shared element transitions helper
const withViewTransition = (cb: () => void) => {
  // @ts-ignore: View Transitions API
  const svt = (document as any)?.startViewTransition
  if (typeof svt === 'function') {
    // @ts-ignore
    svt(() => cb())
  } else {
    cb()
  }
}

const onUpdateImageModalOpen = (value: boolean) => {
  withViewTransition(() => {
    isImageModalOpen.value = value
  })
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
