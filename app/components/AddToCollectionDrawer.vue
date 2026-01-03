<template>
  <NDrawer v-model:open="open" class="sm:hidden">
    <NDrawerContent class="w-full max-w-[100vw] bottom-0 animate-in slide-in-from-bottom-2">
      <NDrawerHeader>
        <NDrawerTitle>Add to Collection</NDrawerTitle>
        <NDrawerDescription>Select a collection to add this image to.</NDrawerDescription>
      </NDrawerHeader>

      <div class="space-y-4 p-4">
        <div v-if="error" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        </div>

        <div v-if="isLoading" class="flex justify-center py-8">
          <NIcon name="i-lucide-loader-2" class="animate-spin h-6 w-6" />
        </div>

        <div v-else-if="collections.length === 0" class="text-center py-8 text-gray-500">
          No collections available
        </div>

        <div v-else class="mt-4 space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="collection in collections"
            :key="collection.id"
            @click="selectCollection(collection)"
            class="p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            :class="selectedCollection?.id === collection.id ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'"
          >
            <div class="flex items-center justify-between">
              <div class="flex gap-3">
                <div class="min-w-0">
                  <h4 class="font-medium">{{ collection.name }}</h4>
                  <p v-if="collection.description" class="text-sm text-gray-500 mt-1">{{ collection.description }}</p>
                </div>
                <NTooltip content="Private collection">
                  <NBadge
                    v-if="collection.is_public === false"
                    badge="solid-gray"
                    icon="i-ph-lock"
                    class="h-6 px-2 py-0.5 text-xs rounded-full"
                  />
                </NTooltip>
              </div>

              <NIcon v-if="selectedCollection?.id === collection.id" name="i-lucide-check" class="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-2 mt-6">
          <NButton btn="ghost-gray" @click="$emit('update:isOpen', false)">Cancel</NButton>
          <NButton @click="$emit('addToCollection')" btn="solid-black" :disabled="!selectedCollection || isAdding" :loading="isAdding">Add to Collection</NButton>
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

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const open = computed({
  get: () => props.isOpen,
  set: (v: boolean) => emit('update:isOpen', v)
})

function selectCollection(collection: Collection) {
  emit('selectCollection', collection)
}
</script>

<style scoped></style>
