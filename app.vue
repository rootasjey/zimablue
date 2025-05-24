<template>
  <div class="min-h-screen w-full flex items-center justify-center">
    <NuxtPage />
    <UToaster />
  </div>
</template>

<script lang="ts" setup>
import '@una-ui/preset/una.css'
import '@/styles/main.css'
import '@/styles/arrow-link.css'

useHead({
  meta: [
    { name: 'view-transition', content: 'same-origin' }
  ]
})
</script>
