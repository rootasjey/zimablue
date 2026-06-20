<template>
  <NDrawer v-model:open="open" class="sm:hidden">
    <NDrawerContent class="w-full max-w-[100vw] bottom-0 animate-in slide-in-from-bottom-2">
      <NDrawerHeader>
        <NDrawerTitle>Add to Collection</NDrawerTitle>
        <NDrawerDescription>Select collections to add this image to.</NDrawerDescription>
      </NDrawerHeader>

      <div class="space-y-4 p-4">
        <div v-if="error" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        </div>

        <!-- Search input -->
        <div class="relative" v-if="!isLoading && collections.length > 0">
          <NIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <NInput
            v-model="searchQuery"
            placeholder="Search collections..."
            class="pl-9"
            size="sm"
          />
        </div>

        <div v-if="isLoading" class="flex justify-center py-8">
          <NIcon name="i-lucide-loader-2" class="animate-spin h-6 w-6" />
        </div>

        <div v-else-if="collections.length === 0" class="text-center py-8 text-gray-500">
          No collections available
        </div>

        <div v-else class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="collection in filteredCollections"
            :key="collection.id"
            @click="toggleCollection(collection)"
            class="p-3 rounded-lg border cursor-pointer transition-colors"
            :class="isSelected(collection) ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'"
          >
            <div class="flex items-center gap-3">
              <!-- Checkbox -->
              <div
                class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                :class="isSelected(collection)
                  ? 'bg-primary border-primary'
                  : 'border-gray-300 dark:border-gray-600'"
              >
                <NIcon
                  v-if="isSelected(collection)"
                  name="i-lucide-check"
                  class="h-3.5 w-3.5 text-white"
                />
              </div>

              <!-- Cover image -->
              <div class="w-10 h-10 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                <img
                  v-if="collection.cover_image?.pathname"
                  :src="`/${collection.cover_image.pathname}`"
                  :alt="collection.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <NIcon name="i-lucide-image" class="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div class="min-w-0 flex-1">
                <h4 class="font-medium truncate">{{ collection.name }}</h4>
                <p v-if="collection.description" class="text-sm text-gray-500 truncate">{{ collection.description }}</p>
              </div>

              <NTooltip content="Private collection">
                <NBadge
                  v-if="collection.is_public === false"
                  badge="solid-gray"
                  icon="i-ph-lock"
                  class="h-6 px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                />
              </NTooltip>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-2 mt-6">
          <NButton btn="ghost-gray" @click="$emit('update:isOpen', false)">Cancel</NButton>
          <NButton
            @click="$emit('addToCollection')"
            btn="solid-black"
            :disabled="selectedCollections.length === 0 || isAdding"
            :loading="isAdding"
          >
            {{ selectedCollections.length === 0 ? 'Add to Collection' : `Add to ${selectedCollections.length} Collection${selectedCollections.length > 1 ? 's' : ''}` }}
          </NButton>
        </div>
      </div>

      <NDrawerFooter />
    </NDrawerContent>
  </NDrawer>
</template>

<script lang="ts" setup>
import type { Collection } from '~~/shared/types/collection'
import type { Image } from '~~/shared/types/image'

interface Props {
  isOpen: boolean
  selectedImage: Image | null
  collections: Collection[]
  filteredCollections: Collection[]
  selectedCollections: Collection[]
  searchQuery: string
  isLoading: boolean
  isAdding: boolean
  error: string | null
}

interface Emits {
  'update:isOpen': [value: boolean]
  'addToCollection': []
  'toggleCollection': [collection: Collection]
  'update:searchQuery': [value: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const open = computed({
  get: () => props.isOpen,
  set: (v: boolean) => emit('update:isOpen', v)
})

const searchQuery = computed({
  get: () => props.searchQuery,
  set: (v: string) => emit('update:searchQuery', v)
})

function isSelected(collection: Collection) {
  return props.selectedCollections.some(c => c.id === collection.id)
}

function toggleCollection(collection: Collection) {
  emit('toggleCollection', collection)
}
</script>

<style scoped></style>
