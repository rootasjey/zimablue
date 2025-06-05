<template>
  <header class="mt-12 mb-8">
    <!-- Navigation -->
    <div class="flex gap-1 items-center">
      <ULink to="/collections" class="text-size-3 hover:scale-102 active:scale-99 transition">
        <span class="i-ph-arrow-left"></span>
      </ULink>
      <span>•</span>
    </div>

    <!-- Title and Edit Button -->
    <div class="flex gap-2 items-center">
      <h1 class="font-body text-xl font-600 text-gray-800 dark:text-gray-200">
        {{ collection?.name || 'Collection' }}
      </h1>
    </div>

    <!-- Description -->
    <p v-if="collection?.description" class="text-size-3 text-gray-500 dark:text-gray-400">
      {{ collection.description }}
    </p>

    <!-- Owner Info -->
    <div v-if="collection?.owner" class="flex items-center gap-2 text-3 text-gray-400 dark:text-gray-400">
      <span>Created by {{ collection.owner.name }}</span>
    </div>

    <!-- Stats -->
    <div class="flex items-center gap-4 font-500 text-sm text-gray-500 dark:text-gray-400 mt-2">
      <span>{{ imageCount }} images</span>
      <span> • </span>
      <span>{{ collection?.stats_views }} views</span>
      <span> • </span>
      <span v-if="collection?.created_at" :title="formattedDateLong">
        {{ formattedDateShort }}
      </span>
    </div>
    
    <!-- Action Buttons -->
    <div v-if="canEdit" 
         class="flex gap-2 mt-4 border-t pt-4 b-dashed border-gray-300 dark:border-gray-700"
    >
      <UButton btn="soft-blue" size="12px" @click="$emit('addImages')">
        <span class="i-ph-plus mr-1"></span>
        Add Images
      </UButton>
      
      <UButton v-if="imageCount > 0" size="12px" btn="soft dark:soft-emerald" @click="$emit('reorder')">
        <span class="i-ph-arrows-out-cardinal mr-1"></span>
        Reorder
      </UButton>

      <UButton 
        v-if="canEdit" 
        size="12px" 
        btn="soft-black dark:soft-orange"
        @click="$emit('edit')" 
      >
      <span class="i-ph-pencil mr-1"></span>
      Edit
      </UButton>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { Collection } from '~/types/collection'

interface Props {
  collection: Collection | null
  imageCount: number
  canEdit: boolean
}

interface Emits {
  edit: []
  addImages: []
  reorder: []
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Computed properties for date formatting
const formattedDateLong = computed(() => {
  if (!props.collection?.created_at) return ''
  
  return new Date(props.collection.created_at).toLocaleDateString('FR-fr', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })
})

const formattedDateShort = computed(() => {
  if (!props.collection?.created_at) return ''
  
  return new Date(props.collection.created_at).toLocaleDateString('FR-fr', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})
</script>