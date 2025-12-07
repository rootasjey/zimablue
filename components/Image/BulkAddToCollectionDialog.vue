<template>
  <NDialog 
    :open="isOpen"
    @update:open="$emit('update:isOpen', $event)"
    title="Add to Collection"
    description="Select a collection to add the selected images to."
    :ui="{ width: 'sm:max-w-md' }"
    :_dialog-close="{
      btn: 'solid-gray',
    }"
  >
    <div class="py-2">
      <p class="text-size-4 text-gray-600 dark:text-gray-400 mb-4">
        Add <strong>{{ imageCount }} {{ imageCount === 1 ? 'image' : 'images' }}</strong> to a collection:
      </p>
      
      <!-- Loading state -->
      <div v-if="isLoadingCollections" class="flex items-center justify-center py-8">
        <div class="flex items-center gap-2 text-gray-500">
          <span class="i-ph-circle-notch animate-spin"></span>
          <span>Loading collections...</span>
        </div>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
        <div class="flex items-start gap-2">
          <span class="i-ph-warning-circle text-red-500 text-size-4 mt-0.5 flex-shrink-0"></span>
          <div class="text-size-3 text-red-700 dark:text-red-300">
            <p class="font-medium">Error loading collections</p>
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
      
      <!-- Collections list -->
      <div v-else-if="collections.length > 0" class="space-y-2 mb-4">
        <div 
          v-for="collection in collections" 
          :key="collection.id"
          class="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          :class="{ 
            'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700': selectedCollection?.id === collection.id 
          }"
          @click="selectCollection(collection)"
        >
          <div class="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center"
               :class="{ 
                 'border-blue-500 bg-blue-500': selectedCollection?.id === collection.id 
               }">
            <div v-if="selectedCollection?.id === collection.id" class="w-2 h-2 bg-white rounded-full"></div>
          </div>
          
          <div class="flex-1">
            <h4 class="font-medium text-gray-900 dark:text-gray-100">{{ collection.name }}</h4>
            <p v-if="collection.description" class="text-size-3 text-gray-500 dark:text-gray-400 truncate">
              {{ collection.description }}
            </p>
            <p class="text-size-3 text-gray-400 dark:text-gray-500">
              {{ collection.image_count || 0 }} images
            </p>
          </div>
        </div>
      </div>
      
      <!-- Empty state -->
      <div v-else class="text-center py-8">
        <span class="i-ph-folder-simple text-gray-400 text-6xl mb-4 block"></span>
        <p class="text-gray-500 dark:text-gray-400 mb-4">No collections found</p>
        <NButton 
          btn="soft-blue" 
          size="sm"
          @click="$emit('createCollection')"
        >
          Create Collection
        </NButton>
      </div>
      
      <div class="mt-6 flex justify-end gap-2 border-t b-dashed border-gray-200 dark:border-gray-800 pt-4">
        <NButton 
          btn="ghost-gray" 
          @click="$emit('update:isOpen', false)"
          :disabled="isAdding"
        >
          Cancel
        </NButton>
        <NButton 
          btn="solid-blue" 
          @click="handleConfirm"
          :loading="isAdding"
          :disabled="isAdding || !selectedCollection"
        >
          {{ isAdding ? 'Adding...' : `Add to ${selectedCollection?.name || 'Collection'}` }}
        </NButton>
      </div>
    </div>
  </NDialog>
</template>

<script lang="ts" setup>
interface Collection {
  id: number
  name: string
  slug: string
  description?: string
  image_count?: number
}

interface Props {
  isOpen: boolean
  imageCount: number
  selectedImageIds: number[]
  collections: Collection[]
  isLoadingCollections: boolean
  error?: string
}

interface Emits {
  'update:isOpen': [value: boolean]
  'confirm': [imageIds: number[], collectionSlug: string]
  'createCollection': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isAdding = ref(false)
const selectedCollection = ref<Collection | null>(null)

const selectCollection = (collection: Collection) => {
  selectedCollection.value = collection
}

const handleConfirm = async () => {
  if (!selectedCollection.value || props.selectedImageIds.length === 0) return
  
  isAdding.value = true
  
  try {
    emit('confirm', props.selectedImageIds, selectedCollection.value.slug)
  } finally {
    // Note: isAdding will be reset by parent component after operation completes
  }
}

// Reset state when dialog opens/closes
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    selectedCollection.value = null
  } else {
    isAdding.value = false
    selectedCollection.value = null
  }
})
</script>
