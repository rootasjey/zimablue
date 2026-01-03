<template>
  <div class="min-h-screen w-full flex items-center justify-center">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    
    <NToaster />
    <GlobalSearchDialog />
    <HiddenFileInputs />
    <UserMenu />
  </div>
</template>

<script lang="ts" setup>
import '@una-ui/preset/una.css'
import GlobalSearchDialog from '~/components/search/GlobalSearchDialog.vue'
import HiddenFileInputs from '~/components/HiddenFileInputs.vue'

useGlobalSearch()

useHead({
  meta: [
    { name: 'view-transition', content: 'same-origin' }
  ]
})
</script>
