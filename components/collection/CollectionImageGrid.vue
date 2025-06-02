<template>
  <section>
    <!-- Image selection controls for owner -->
    <div class="flex items-center mb-4">
      <h3 class="text-3 font-600 text-gray-800 dark:text-gray-200">
        {{ images.length }} Images
      </h3>
      
      <div v-if="canEdit" class="ml-12 flex gap-2" 
        :class="{
          'opacity-100': hasSelectedImages,
          'opacity-0': !hasSelectedImages,
        }"
      >
        <UButton size="12px" btn="soft-gray" @click="$emit('clearSelection')">
          <i class="i-ph-x"></i>
          <span>Cancel</span>
        </UButton>
        <UButton size="12px" btn="soft-error" @click="$emit('removeImages')">
          Remove {{ selectionCount }} Images
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <div  
        v-for="image in images" 
        :key="image.id" 
        class="group relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-150 hover:scale-102 active:scale-100 cursor-pointer"
        @click="$emit('imageClick', image)"
      >
        <!-- Selection checkbox for owner -->
        <div 
          v-if="canEdit" 
          class="opacity-0 group-hover:opacity-100 absolute top-2 right-2 z-10" 
          @click.stop
          :class="{ 
            'opacity-100': hasSelectedImages
          }"
        >
          <UCheckbox v-model:model-value="selectedImagesMap[image.id]" />
        </div>
        
        <!-- Set as cover button for owner -->
        <div 
          v-if="canEdit && !selectedImagesMap[image.id]" 
          class="opacity-0 group-hover:opacity-100 absolute top-2 left-2 z-10" 
          @click.stop
        >
          <UButton 
            v-if="coverImageId !== image.id"
            size="xs" 
            icon 
            btn="soft" 
            class="opacity-70 hover:opacity-100"
            @click="$emit('setCover', image.id)"
          >
            <span class="i-ph-star"></span>
          </UButton>
          <span v-else class="i-ph-star-fill text-amber-400"></span>
        </div>
        
        <NuxtImg 
          provider="hubblob" 
          :width="100"
          :src="`/${image.pathname}`" 
          :alt="image.name || 'Image'" 
          class="w-full h-42 object-cover" 
        />
        <div class="opacity-0 group-hover:opacity-100 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-3">
          <h3 class="text-white text-sm font-medium truncate">{{ image.name }}</h3>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { Image } from '~/types/image'

interface Props {
  canEdit: boolean
  coverImageId?: number
  hasSelectedImages: boolean
  images: Image[]
  selectedImagesMap: Record<number, boolean>
  selectionCount: number
}

defineProps<Props>()

defineEmits<{
  clearSelection: []
  imageClick: [image: Image]
  removeImages: []
  setCover: [imageId: number]
}>()
</script>