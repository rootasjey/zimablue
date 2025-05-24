<template>
  <div class="flex flex-col justify-center 
    overflow-auto
    min-h-screen w-full transition-all duration-500
    "
  >

    <NuxtLink to="/collections" class="absolute top-2 right-4 text-size-8 text-gray-400 hover:scale-105 active:scale-99 transition">
      <span class="i-ph-x"></span>
    </NuxtLink>

    <!-- Header -->
    <header class="mt-16 mb-4 md:p-8 flex flex-col items-center justify-center">
      <div class="flex items-center gap-2">
        <h1 class="font-sans font-size-16 font-200 text-gray-800 dark:text-gray-200">
          {{ collection?.name || 'Collection' }}
        </h1>
      </div>

      <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{{ collection.items.length }} images</span>
        <span>{{ collection.stats_views }} views</span>
        <span>{{ new Date(collection.created_at).toLocaleDateString("FR-fr", {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }) }}</span>
      </div>
      
      <p v-if="collection.description" class="text-gray-600 dark:text-gray-400">
        {{ collection.description }}
      </p>
    </header>

    <!-- Content -->
    <div class="w-full mx-auto mt-12">
      <div class="prose dark:prose-invert prose-lg mx-auto px-4">
        <!-- Loading State -->
        <section v-if="pending" class="flex justify-center items-center py-12">
          <div class="i-line-md:loading-twotone-loop w-12 h-12 text-gray-400 dark:text-gray-600"></div>
        </section>

        <!-- Error State -->
        <section v-else-if="error" class="text-center py-12">
          <div class="i-ph-warning-circle text-size-16 text-amber-500 mx-auto mb-4"></div>
          <h3 class="text-size-12 font-semibold mb-2 text-gray-800 dark:text-gray-200">
            Something went wrong
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ error.message }}
          </p>
          <UButton @click="refresh">Try Again</UButton>
        </section>

        <!-- Images Grid -->
        <section v-else-if="images.length > 0" class="mt-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div v-for="image in images" :key="image.id" 
                class="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 active:scale-100">
              <NuxtLink :to="`/images/${image.pathname}`">
                <img :src="`/images/${image.pathname}`" 
                    :alt="image.name || 'Image'" 
                    class="w-full h-48 object-cover" />
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-3">
                  <h3 class="text-white text-sm font-medium truncate">{{ image.name }}</h3>
                  <div class="flex items-center gap-2 text-xs text-gray-300 mt-1">
                    <span>{{ image.stats_views }} views</span>
                    <span>{{ image.stats_likes }} likes</span>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </section>

        <!-- Empty State -->
        <section v-else class="text-center py-12">
          <h3 class="mb-2 text-size-4 italic font-200 text-gray-800 dark:text-gray-200">
            There is no images in this collection yet.
          </h3>
          <UButton v-if="loggedIn" btn="outline" @click="navigateToGallery">
            Add images from gallery
          </UButton>

          <div class="flex gap-4 justify-center mt-4">
            <div v-for="i in [1, 2, 3]" 
              class="border border-dashed rounded-2 
              flex items-center justify-center
              w-22 h-22"
            >
              <div class="i-ph-image-square-duotone text-size-6 text-gray-400"></div>
            </div>
          </div>
        </section>

        <!-- Edit Collection Dialog -->
        <UDialog
          title="Edit Collection"
          description="Rename, update description or change collection's visibility"
          v-model:open="isEditDialogOpen"
        >
          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <div class="grid grid-cols-3 items-center gap-4">
                <ULabel for="edit-collection-name">
                  Name
                </ULabel>
                <UInput
                  id="edit-collection-name"
                  v-model="editCollection.name"
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
                  v-model="editCollection.description"
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
                    v-model="editCollection.isPublic"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 mt-4">
            <UButton btn="ghost-gray" @click="closeEditDialog">
              Cancel
            </UButton>
            <UButton btn="solid" @click="updateCollection">
              Update collection
            </UButton>
          </div>
        </UDialog>
      </div>
    </div>

    <!-- Navigation -->
    <FooterNavigation />
  </div>
</template>

<script lang="ts" setup>
import type { Collection } from '~/types/collection'
import type { Image } from '~/types/image'

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const { loggedIn } = useUserSession()
const collectionId = route.params.id

// Fetch collection data
const { data, error, pending, refresh } = await useFetch(`/api/collections/${collectionId}`)

const collection = computed(() => data.value?.collection) as ComputedRef<Collection>
const images = computed(() => data.value?.images || [])

// Edit collection state
const isEditDialogOpen = ref(false)
const editCollection = ref({
  name: '',
  description: '',
  isPublic: false
})

// Initialize edit form when collection data is available
watch(collection, (newCollection) => {
  if (newCollection) {
    editCollection.value = {
      name: newCollection.name,
      description: newCollection.description || '',
      isPublic: newCollection.is_public === 1
    }
  }
}, { immediate: true })

// Time-based greeting and icon
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

// Collection actions
const collectionMenuItems = [
  {
    label: 'Edit',
    onClick: () => {
      isEditDialogOpen.value = true
    }
  },
  {
    label: 'Delete',
    onClick: () => {
      deleteCollection()
    }
  }
]

const closeEditDialog = () => {
  isEditDialogOpen.value = false
}

const updateCollection = async () => {
  try {
    // Validate form
    if (!editCollection.value.name) {
      toast({
        title: 'Error',
        description: 'Collection name is required',
        toast: 'soft-error',
        duration: 3000
      })
      return
    }

    // API call to update collection
    await $fetch(`/api/collections/${collectionId}`, {
      method: 'PUT',
      body: {
        name: editCollection.value.name,
        description: editCollection.value.description,
        is_public: editCollection.value.isPublic
      }
    })

    toast({
      title: 'Success',
      description: 'Collection updated successfully',
      toast: 'soft-success',
      duration: 3000
    })

    closeEditDialog()
    refresh()
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to update collection. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  }
}

const deleteCollection = async () => {
  try {
    await $fetch(`/api/collections/${collectionId}`, {
      method: 'DELETE'
    })

    toast({
      title: 'Success',
      description: 'Collection deleted successfully',
      toast: 'soft-success',
      duration: 3000
    })

    // Navigate back to collections list
    router.push('/collections')
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to delete collection. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  }
}

const navigateToGallery = () => {
  router.push('/')
}
</script>

<style scoped>
.footer-nav {
  background: linear-gradient(to bottom, #ffffff, #e0e0e0);
}
.dark .footer-nav {
  background: linear-gradient(to bottom, #0C0A09, #000);
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
