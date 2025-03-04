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
import type { Image } from '~/types/image';

const router = useRouter()
const route = useRoute()

// Use ref to make it reactive
const image = ref<Image | undefined>()

if (import.meta.client && history && !image.value) {
  image.value = history.state.imageData
}

if (import.meta.server && !image.value) {
  const imageId = route.params.id
  const data = await $fetch(`/api/images/id/${imageId}`)
  image.value = data
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    router.back()
  }
}


onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown)
  if (image.value) return
  
  if (!image.value) {
    const imageId = route.params.id
    const data = await $fetch(`/api/images/id/${imageId}`)
    image.value = data
  }
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