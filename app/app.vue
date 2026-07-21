<template>
  <div class="min-h-screen w-full">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    
    <NToaster />
    <div class="hidden sm:block">
      <GlobalSearchDialog />
    </div>
    <HiddenFileInputs />
  </div>
</template>

<script lang="ts" setup>
import '@una-ui/preset/una.css'
import GlobalSearchDialog from '~/components/search/GlobalSearchDialog.vue'
import HiddenFileInputs from '~/components/HiddenFileInputs.vue'

useGlobalSearch()

const route = useRoute()
const config = useRuntimeConfig()

useHead({
  meta: [
    { name: 'view-transition', content: 'same-origin' }
  ],
  link: [
    { rel: 'canonical', href: `${config.public.siteUrl}${route.path}` }
  ]
})

useSeoMeta({
  ogType: 'website',
  ogSiteName: 'Zima Blue',
  ogLocale: 'en_US',
  twitterCard: 'summary_large_image',
  twitterSite: '@rootasjey',
  twitterCreator: '@rootasjey',
})
</script>
