<template>
  <div class="min-h-screen w-full flex items-center justify-center">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    
    <UToaster />
    <GlobalSearchDialog />
    <HiddenFileInputs />
    <DesktopBottomNav />
    <UserMenu />
    <ClickFireworks v-if="fireworksEnabled" />
  </div>
</template>

<script lang="ts" setup>
import '@una-ui/preset/una.css'
import '@/styles/main.css'
import '@/styles/arrow-link.css'
import GlobalSearchDialog from '~/components/search/GlobalSearchDialog.vue'
import HiddenFileInputs from '~/components/HiddenFileInputs.vue'
import ClickFireworks from '~/components/ClickFireworks.vue'
import { useAppSettings } from '~/composables/useAppSettings'

useGlobalSearch()
const { fireworksEnabled } = useAppSettings()

useHead({
  meta: [
    { name: 'view-transition', content: 'same-origin' }
  ]
})
</script>
