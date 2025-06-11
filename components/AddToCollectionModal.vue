<template>
  <UDialog 
    :open="isOpen"
    @update:open="$emit('update:isOpen', $event)"
    :ui="{ width: 'w-full sm:max-w-md' }"
    :_dialog-close="{
      btn: 'solid-gray',
    }"
  >
    <UCard>
      <template #header>
        <div>
          <h3 class="text-lg font-semibold">Add to Collection</h3>
          <p class="text-sm text-gray-500">
            Select a collection to add this image to.
          </p>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Error message -->
        <div v-if="error" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        </div>

        <div v-if="isLoading" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin h-6 w-6" />
        </div>

        <div v-else-if="collections.length === 0" class="text-center py-8 text-gray-500">
          No collections available
        </div>

        <div v-else class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="collection in collections"
            :key="collection.id"
            @click="selectCollection(collection)"
            class="p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            :class="selectedCollection?.id === collection.id ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">{{ collection.name }}</h4>
                <p v-if="collection.description" class="text-sm text-gray-500 mt-1">
                  {{ collection.description }}
                </p>
              </div>
              <UIcon 
                v-if="selectedCollection?.id === collection.id"
                name="i-lucide-check" 
                class="h-5 w-5 text-primary" 
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-2 mt-6">
          <UButton btn="ghost-gray" @click="$emit('update:isOpen', false)">
            Cancel
          </UButton>
          <UButton 
            @click="$emit('addToCollection')" 
            btn="solid-black"
            :disabled="!selectedCollection || isAdding"
            :loading="isAdding"
          >
            Add to Collection
          </UButton>
        </div>
      </template>
    </UCard>
  </UDialog>
</template>

<script lang="ts" setup>
import type { Collection } from '~/types/collection'
import type { Image } from '~/types/image'

interface Props {
  isOpen: boolean
  selectedImage: Image | null
  collections: Collection[]
  selectedCollection: Collection | null
  isLoading: boolean
  isAdding: boolean
  error: string | null
}

interface Emits {
  'update:isOpen': [value: boolean]
  'addToCollection': []
  'selectCollection': [collection: Collection]
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function selectCollection(collection: Collection) {
  emit('selectCollection', collection)
}
</script>