<template>
  <div class="min-h-screen w-full bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div class="sm:py-6 sm:pb-28 mb-24">
        <PageHeader v-if="showHomeHeader" />
        <TopBar v-else-if="showTopBar" />
        <slot />
      </div>

    <BottomNav v-if="showBottomNav" />
  </div>
  
</template>

<script lang="ts" setup>
// Hide the desktop bottom nav on full-screen illustration pages (e.g. /illustrations/:slug)
import { computed } from 'vue'
import PageHeader from '~/components/PageHeader.vue'
import TopBar from '~/components/TopBar.vue'
import usePageHeader from '~/composables/usePageHeader'
const route = useRoute()
const pageHeader = usePageHeader()
const isIllustrationPage = computed(() => /^\/illustrations\/[^^/]+$/.test(route.path))
const showBottomNav = computed(() => {
  // Hide only when path matches /illustrations/:slug (no trailing segments)
  return !isIllustrationPage.value
})

const showHomeHeader = computed(() => pageHeader.showHeader.value !== false && route.path === '/' && !isIllustrationPage.value)
const showTopBar = computed(() => pageHeader.showHeader.value !== false && route.path !== '/' && !isIllustrationPage.value)
</script>
