<template>
  <div class="frame">
    <!-- Header -->
    <header class="mt-12 mb-8">
      <div class="flex gap-1 items-center">
        <ULink to="/collections" class="text-size-3 hover:scale-102 active:scale-99 transition">
          <span class="i-ph-arrow-left"></span>
        </ULink>
        <span>•</span>
      </div>
      <div class="flex gap-2 items-center">
        <h1 class="font-body text-xl font-600 text-gray-800 dark:text-gray-200">
          {{ store.collection?.name || 'Collection' }}
        </h1>

        <!-- Edit button for collection owner -->
        <UButton 
          v-if="isOwner" 
          icon 
          size="8px" 
          btn="solid-black"
          class="i-ph-pencil-simple" 
          @click="store.openEditDialog" 
        />
      </div>

      <p v-if="store.collection?.description" class="text-size-3 text-gray-500 dark:text-gray-400">
        {{ store.collection.description }}
      </p>

      <!-- Owner info -->
      <div v-if="store.collection?.owner" class="flex items-center gap-2 text-3 text-gray-400 dark:text-gray-400">
        <span>Created by {{ store.collection.owner.name }}</span>
      </div>

      <div class="flex items-center gap-4 font-500 text-sm text-gray-500 dark:text-gray-400 mt-2">
        <span>{{ store.images.length }} images</span>
        <span> • </span>
        <span>{{ store.collection?.stats_views }} views</span>
        <span> • </span>
        <span v-if="store.collection?.created_at" :title="new Date(store.collection.created_at).toLocaleDateString('FR-fr', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
          })">
          {{ store.collection?.created_at ? new Date(store.collection.created_at).toLocaleDateString("FR-fr", {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }) : '' }}
        </span>
      </div>
      
      <!-- Action buttons for collection owner -->
      <div v-if="isOwner && store.images.length > 0" 
        class="flex gap-2 mt-4 border-t pt-4 b-dashed border-gray-300 dark:border-gray-700">
        <UButton btn="soft-blue" size="12px" @click="store.startAddingImages">
          <span class="i-ph-plus mr-1"></span>
          Add Images
        </UButton>
        
        <UButton v-if="store.images.length > 0" size="12px" btn="soft dark:soft-emerald" @click="store.startReordering">
          <span class="i-ph-arrows-out-cardinal mr-1"></span>
          Reorder
        </UButton>
      </div>
    </header>

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
        <UButton @click="store.fetchCollection(collectionId)">Try Again</UButton>
      </section>

      <!-- Image Selection Mode -->
      <section v-else-if="store.isAddingImages" class="mt-8">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-4 font-500 text-gray-800 dark:text-gray-200">
            Select images to add
          </h3>
          <div class="flex gap-2">
            <UButton size="12px" btn="outline-gray" @click="store.toggleSelectAll">
              {{ store.isAllSelected ? 'Deselect All' : 'Select All' }}
            </UButton>
            <UButton size="12px" btn="outline-gray" @click="store.cancelAddingImages">
              Cancel
            </UButton>
            <UButton btn="solid-gray" size="12px" :disabled="!store.hasSelectedImages" @click="handleAddImages">
              Add {{ store.selectionCount }} Images
            </UButton>
          </div>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="image in store.availableImages" :key="image.id" 
              class="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg 
              hover:scale-102 active:scale-100 cursor-pointer 
              transition-all duration-150"
              @click="store.toggleImageSelection(image.id)">
            <div class="absolute top-2 right-2 z-10">
              <UCheckbox checkbox="success" @click.stop v-model:model-value="store.selectedImagesMap[image.id]" />
            </div>
            <NuxtImg 
              provider="hubblob"
              :src="`/${image.pathname}`" 
              :width="100"
              :alt="image.name || 'Image'" 
              class="w-full h-48 object-cover" 
            />
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-3">
              <h3 class="text-white text-sm font-medium truncate">{{ image.name }}</h3>
            </div>
          </div>
        </div>
        
        <div v-if="store.availableImages.length === 0" class="text-center py-12">
          <p class="text-gray-600 dark:text-gray-400">
            No more images available to add.
          </p>
        </div>
      </section>

      <!-- Reordering Mode -->
      <section v-else-if="store.isReordering" class="mt-8">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200">
            Reorder images
          </h3>
          <div class="flex gap-2">
            <UButton size="sm" btn="outline" @click="store.cancelReordering">
              Cancel
            </UButton>
            <UButton size="sm" @click="handleSaveOrder">
              Save Order
            </UButton>
          </div>
        </div>
        
        <!-- Implement your drag-and-drop component here -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="image in store.images" :key="image.id" 
              class="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-move">
            <div class="absolute top-2 right-2 z-10">
              <span class="i-ph-dots-six-vertical text-white"></span>
            </div>
            <img :src="`/${image.pathname}`" 
                :alt="image.name || 'Image'" 
                class="w-full h-48 object-cover" />
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-3">
              <h3 class="text-white text-sm font-medium truncate">{{ image.name }}</h3>
            </div>
          </div>
        </div>
      </section>

      <!-- Normal View with Images -->
      <section v-else-if="store.images.length > 0" class="mt-8">
        <!-- Image selection controls for owner -->
        <div v-if="isOwner" class="flex items-center mb-4">
          <h3 class="text-3 font-600 text-gray-800 dark:text-gray-200">
            {{ store.images.length }} Images
          </h3>
          <div class="ml-12 flex gap-2" 
            :class="{
              'opacity-100': store.hasSelectedImages,
              'opacity-0': !store.hasSelectedImages,
            }"
          >
            <UButton size="12px" btn="soft-gray" @click="store.clearSelection">
              <i class="i-ph-x"></i>
              <span>Cancel</span>
            </UButton>
            <UButton size="12px" btn="soft-error" @click="handleRemoveImages">
              Remove {{ store.selectionCount }} Images
            </UButton>
          </div>
        </div>
        
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div  v-for="image in store.images" :key="image.id" 
            class="group relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-150 hover:scale-102 active:scale-100 cursor-pointer"
            @click="openImageModal(image)"
          >
            <!-- Selection checkbox for owner -->
            <div v-if="isOwner" class="opacity-0 group-hover:opacity-100 absolute top-2 right-2 z-10" @click.stop
             :class="{ 
                'opacity-100': store.hasSelectedImages
              }">
              <UCheckbox v-model:model-value="store.selectedImagesMap[image.id]" />
            </div>
            
            <!-- Set as cover button for owner -->
            <div v-if="isOwner && !store.selectedImagesMap[image.id]" 
                class="opacity-0 group-hover:opacity-100 absolute top-2 left-2 z-10" @click.stop>
              <UButton v-if="store.collection?.cover_image_id !== image.id"
                  size="xs" icon btn="soft" 
                  class="opacity-70 hover:opacity-100"
                  @click="handleSetAsCover(image.id)">
                <span class="i-ph-star"></span>
              </UButton>
              <span v-else class="i-ph-star-fill text-amber-400"></span>
            </div>
            
            <NuxtImg 
                provider="hubblob" 
                :width="100"
                :src="`/${image.pathname}`" 
                :alt="image.name || 'Image'" 
                class="w-full h-42 object-cover" />
            <div class="opacity-0 group-hover:opacity-100 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-3">
              <h3 class="text-white text-sm font-medium truncate">{{ image.name }}</h3>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <section v-else class="mb-16 text-center">
        <div class="py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
          <div class="flex gap-4 justify-center mb-8">
            <div v-for="i in [1, 2, 3]" 
              class="border border-dashed rounded-2 
              flex items-center justify-center
              w-22 h-22"
            >
              <div class="i-ph-image-square-duotone text-size-6 text-gray-400"></div>
            </div>
          </div>
          <h2 class="text-size-6 font-body font-semibold mb-2 text-gray-800 dark:text-gray-200">nothing here yet</h2>
          <p class="text-size-4 font-200 text-gray-500 dark:text-gray-400 mb-6 mx-auto max-w-md">
            There are no images in this collection yet.
          </p>

          <UButton v-if="isOwner" btn="outline" @click="store.startAddingImages">
            Add images from gallery
          </UButton>
        </div>
      </section>

      <!-- Edit Collection Dialog -->
      <UDialog
        title="Edit Collection"
        description="Rename, update description or change collection's visibility"
        v-model:open="store.isEditDialogOpen"
      >
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <div class="grid grid-cols-3 items-center gap-4">
              <ULabel for="edit-collection-name">
                Name
              </ULabel>
              <UInput
                id="edit-collection-name"
                v-model="store.editCollection.name"
                placeholder="My Collection"
                :una="{
                  inputWrapper: 'col-span-2',
                }"
              />
            </div>
            
            <div class="grid grid-cols-3 items-center gap-4">
              <ULabel for="edit-collection-description">
                Description
              </ULabel>
              <UInput
                id="edit-collection-description"
                type="textarea"
                v-model="store.editCollection.description"
                placeholder="Describe your collection..."
                :una="{
                  inputWrapper: 'col-span-2',
                }"
              />
            </div>
            
            <div class="grid grid-cols-3 items-center gap-4">
              <ULabel for="edit-collection-public">
                Public
              </ULabel>
              <div class="col-span-2">
                <USwitch
                  id="edit-collection-public"
                  v-model="store.editCollection.isPublic"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-between gap-3 mt-4">
          <UButton btn="soft-error" @click="handleDeleteCollection">
            Delete Collection
          </UButton>
          
          <div class="flex gap-2">
            <UButton btn="ghost-gray" @click="store.closeEditDialog">
              Cancel
            </UButton>
            <UButton btn="solid" @click="handleUpdateCollection">
              Update collection
            </UButton>
          </div>
        </div>
      </UDialog>
    </div>

    <Footer class="mt-34" />

    <!-- Image Modal -->
    <UDialog v-model:open="isImageModalOpen" :ui="{ width: 'max-w-7xl' }">
      <div class="relative">
        <!-- Modal header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ selectedImage?.name || 'Image' }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              from {{ store.collection?.name }}
            </p>
          </div>
          <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{{ selectedImage?.stats_views }} views</span>
            <span>{{ selectedImage?.stats_likes }} likes</span>
          </div>
        </div>
        
        <!-- Modal content -->
        <div class="p-4">
          <div class="flex justify-center">
            <NuxtImg 
              v-if="selectedImage"
              provider="hubblob"
              :width="600"
              :src="`/${selectedImage.pathname}`"
              :alt="selectedImage.name || 'Image'"
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
            {{ currentImageIndex + 1 }} of {{ store.images.length }}
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

const route = useRoute()
const { toast } = useToast()
const { loggedIn, user } = useUserSession()

const collectionId = route.params.id as string

// Initialize the store
const store = useCollectionDetailStore()

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
    await store.fetchCollection(collectionId)
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

// Handler methods that wrap store actions with toast notifications
const handleAddImages = async () => {
  try {
    const result = await store.addImagesToCollection(collectionId)
    
    toast({
      title: result.success ? 'Success' : 'Error',
      description: result.message,
      toast: result.success ? 'soft-success' : 'soft-error',
      duration: 3000,
    })
  } catch (err) {
    toast({
      title: 'Error',
      description: 'Failed to add images to collection.',
      toast: 'soft-error',
      duration: 3000
    })
  }
}

const handleRemoveImages = async () => {
  try {
    const result = await store.removeImagesFromCollection(collectionId)
    
    toast({
      title: result.success ? 'Success' : 'Error',
      description: result.message,
      toast: result.success ? 'soft-success' : 'soft-error',
      duration: 3000,
    })
  } catch (err) {
    toast({
      title: 'Error',
      description: 'Failed to remove images from collection.',
      toast: 'soft-error',
      duration: 3000
    })
  }
}

const handleSaveOrder = async () => {
  try {
    const newOrder = store.images.map(img => img.id)
    const result = await store.saveNewOrder(collectionId, newOrder)
    
    toast({
      title: result.success ? 'Success' : 'Error',
      description: result.message,
      toast: result.success ? 'soft-success' : 'soft-error',
      duration: 3000,
    })
  } catch (err) {
    toast({
      title: 'Error',
      description: 'Failed to update image order.',
      toast: 'soft-error',
      duration: 3000
    })
  }
}

const handleSetAsCover = async (imageId: number) => {
  try {
    const result = await store.setAsCover(collectionId, imageId)

    toast({
      title: result.success ? 'Success' : 'Error',
      description: result.message,
      toast: result.success ? 'soft-success' : 'soft-error',
      duration: 3000,
    })
  } catch (err) {
    toast({
      title: 'Error',
      description: 'Failed to update cover image.',
      toast: 'soft-error',
      duration: 3000
    })
  }
}

const handleUpdateCollection = async () => {
  try {
    const result = await store.updateCollection(collectionId)
    
    toast({
      title: result.success ? 'Success' : 'Error',
      description: result.message,
      toast: result.success ? 'soft-success' : 'soft-error',
      duration: 3000,
    })
  } catch (err) {
    toast({
      title: 'Error',
      description: 'Failed to update collection. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  }
}

const handleDeleteCollection = async () => {
  if (!confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
    return
  }

  try {
    const result = await store.deleteCollection(collectionId)
    
    toast({
      title: result.success ? 'Success' : 'Error',
      description: result.message,
      toast: result.success ? 'soft-success' : 'soft-error',
      duration: 3000,
    })
  } catch (err) {
    toast({
      title: 'Error',
      description: 'Failed to delete collection.',
      toast: 'soft-error',
      duration: 3000
    })
  }
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
