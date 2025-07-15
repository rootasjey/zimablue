<template>
  <div class="min-h-screen w-full flex items-center justify-center">
    <NuxtPage />
    <UToaster />

    <!-- Global Search Dialog -->
    <GlobalSearchDialog />
  </div>
</template>

<script lang="ts" setup>
import '@una-ui/preset/una.css'
import '@/styles/main.css'
import '@/styles/arrow-link.css'
import GlobalSearchDialog from '~/components/search/GlobalSearchDialog.vue'

// Setup global search functionality
const globalSearch = useGlobalSearch()

useHead({
  meta: [
    { name: 'view-transition', content: 'same-origin' }
  ]
})
</script>
