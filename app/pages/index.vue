<template>
  <div class="frame mt-2 md:mt-0">
    <!-- Mobile Home Layout -->
    <MobileHomeLayout
      v-if="!isInitialGridLoading && layout.length > 0"
      :layout="layout"
      @open-image="(image, event) => imageModal.openImageModal(image, event)"
    />

    <!-- Desktop gallery -->
    <div class="hidden sm:block">
      <GalleryView />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useGridStore } from '@/stores/useGridStore'
import { useImageModal } from '~/composables/image/useImageModal'

const gridStore = useGridStore()
const layout = computed(() => gridStore.layout)
const isInitialGridLoading = computed(() => !gridStore.initialized)
const imageModal = useImageModal()

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
