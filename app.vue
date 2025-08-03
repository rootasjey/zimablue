<template>
  <div class="min-h-screen w-full flex items-center justify-center">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UToaster />
    <GlobalSearchDialog />
    <MobileBottomNav />
  </div>
</template>

<script lang="ts" setup>
import '@una-ui/preset/una.css'
import '@/styles/main.css'
import '@/styles/arrow-link.css'
import GlobalSearchDialog from '~/components/search/GlobalSearchDialog.vue'

// Setup global search functionality
useGlobalSearch()

useHead({
  meta: [
    { name: 'view-transition', content: 'same-origin' }
  ]
})
</script>
