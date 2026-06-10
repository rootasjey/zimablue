<template>
  <div class="frame mt-2 md:mt-0">
    <div class="px-4 mx-auto">
      <h1 class="font-body font-500 tracking-[0.3em] text-lg text-gray-900 dark:text-gray-100">Browse all illustrations</h1>
    </div>
    <GalleryView />
  </div>
</template>

<script lang="ts" setup>
import { useGridStore } from '@/stores/useGridStore'

definePageMeta({
  title: 'Browse — All Illustrations',
})

const gridStore = useGridStore()
const layout = computed(() => gridStore.layout)

useSeoMeta({
  title: 'Browse Illustrations',
  description: 'Browse the complete collection of digital illustrations',
})

onMounted(() => {
  if (!gridStore.initialized) {
    gridStore.fetchGrid()
  }
})
</script>

<style scoped>
.frame {
  display: flex;
  flex-direction: column;
  overflow: auto;
  width: 100%;
  border-radius: 0.75rem;
  transition: all 500ms;

  @media (min-width: 768px) {
    justify-content: center;
  }
}
</style>
