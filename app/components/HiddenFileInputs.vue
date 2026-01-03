<template>
  <!-- Hidden inputs wired app-wide -->
  <input
    type="file"
    ref="fileInputLocal"
    class="hidden"
    accept="image/*"
    multiple
    @change="imageUpload.handleFileSelect"
  />
  <input
    type="file"
    ref="replacementFileInputLocal"
    class="hidden"
    accept="image/*"
    @change="imageUpload.handleReplaceFileSelect"
  />
</template>

<script lang="ts" setup>
import { useImageUpload } from '~/composables/image/useImageUpload'
// Mount one per app (we put it in app.vue implicitly via global slot/layout)
const imageUpload = useImageUpload()

const fileInputLocal = ref<HTMLInputElement>()
const replacementFileInputLocal = ref<HTMLInputElement>()

// Bridge local refs to global state so any component can trigger clicks
onMounted(() => {
  imageUpload.fileInput.value = fileInputLocal.value
  imageUpload.replacementFileInput.value = replacementFileInputLocal.value
})

onBeforeUnmount(() => {
  imageUpload.fileInput.value = undefined
  imageUpload.replacementFileInput.value = undefined
})
</script>
