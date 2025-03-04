<template>
  <div class="w-full h-screen flex justify-center items-center inset-0 bg-black/90 z-50">
    <div class="container w-800px flex justify-center items-start">
      <NuxtImg
        v-if="image"
        provider="hubblob"
        width="600"
        height="600"
        :src="image?.pathname"
        :alt="image?.pathname"
        class="w-full h-full object-cover"
        :style="`view-transition-name: shared-image-${image?.id}`"
      />
      <button 
        @click="router.back()"
        class="mt-0 ml-2 text-white hover:scale-110 active:scale-90 transition"
      >
      <div class="i-line-md-close-circle-filled text-2xl" />
    </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGridStore } from '@/stores/useGridStore';
import type { Image } from '~/types/image';

const router = useRouter()
const route = useRoute()
const gridStore = useGridStore()

// const image = ref<Image | undefined>()
  const image = computed(() => {
  // Try to get image from store first
  if (gridStore.selectedImage?.id.toString() === route.params.id) {
    return gridStore.selectedImage
  }
  // Fallback to history state
  if (import.meta.client && history?.state?.imageData) {
    return history.state.imageData
  }
  return undefined
})


// Fetch image if not available in store or history
async function fetchImage() {
  if (!image.value) {
    const imageId = route.params.id
    const data = await $fetch(`/api/images/id/${imageId}`)
    gridStore.selectedImage = data
  }
}


if (import.meta.server) {
  await fetchImage()
}

// if (import.meta.client && history && !image.value) {
//   image.value = history.state.imageData
// }

// if (import.meta.server && !image.value) {
//   const imageId = route.params.id
//   const data = await $fetch(`/api/images/id/${imageId}`)
//   image.value = data
// }


onMounted(async () => {
  await fetchImage()
  // Prefetch adjacent images for smooth navigation
  if (image.value) {
    gridStore.prefetchAdjacentImages(image.value.id)
  }
})

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    router.back()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

</script>

<style>
::view-transition-old(shared-image-*),
::view-transition-new(shared-image-*) {
  mix-blend-mode: normal;
}

::view-transition-old(shared-image-*) {
  animation: fade-out 0.5s ease-in-out forwards;
}

::view-transition-new(shared-image-*) {
  animation: fade-in 0.5s ease-in-out forwards;
}

@keyframes fade-in {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes fade-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.8); }
}
</style>