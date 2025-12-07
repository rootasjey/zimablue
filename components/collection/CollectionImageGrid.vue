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
        <NButton size="12px" btn="soft-gray" @click="$emit('clearSelection')">
          <i class="i-ph-x"></i>
          <span>Cancel</span>
        </NButton>
        <NButton size="12px" btn="soft-error" @click="$emit('removeImages')">
          Remove {{ selectionCount }} Images
        </NButton>
      </div>
    </div>

    <div class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-8 [content-visibility:auto]">
      <div  
        v-for="(image, index) in images" 
        :key="image.id" 
        class="group relative overflow-hidden rounded-sm ring-1 ring-gray-200/60 dark:ring-gray-800/60 hover:ring-gray-300/70 dark:hover:ring-gray-700/70 transition-all duration-200 hover:shadow-md active:shadow-sm cursor-pointer animate-fade-in-up"
        :style="{ animationDelay: `${index * 50}ms` }"
        @click="$emit('imageClick', image)"
      >
        <!-- Selection checkbox for owner -->
        <div 
          v-if="canEdit" 
          class="opacity-0 group-hover:opacity-100 absolute top-2 right-2 z-2" 
          @click.stop
          :class="{ 
            'opacity-100': hasSelectedImages
          }"
        >
          <NCheckbox v-model:model-value="selectedImagesMap[image.id]" />
        </div>
        
        <!-- Set as cover button for owner -->
        <div 
          v-if="canEdit && !selectedImagesMap[image.id]" 
          class="opacity-0 group-hover:opacity-100 absolute top-2 left-2 z-10" 
          @click.stop
        >
          <NButton 
            v-if="coverImageId !== image.id"
            size="xs" 
            icon 
            btn="soft-gray" 
            class="opacity-70 hover:opacity-100"
            @click="$emit('setCover', image.id)"
          >
            <span class="i-ph-star"></span>
          </NButton>
          <span v-else class="i-ph-star-fill text-amber-400"></span>
        </div>
        
        <NuxtImg 
          provider="hubblob" 
          :width="100"
          :src="`/${image.pathname}`" 
          :alt="image.name || 'Image'" 
          class="w-full aspect-[4/4] object-cover" 
          :style="{ viewTransitionName: `image-${image.id}` }"
          loading="lazy"
          decoding="async"
        />
        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
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

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
}

/* Enhanced hover animation */
.group:hover {
  transform: translateY(-2px);
}

.group:active {
  transform: translateY(0);
}
</style>