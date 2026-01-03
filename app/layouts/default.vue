<template>
  <div class="min-h-screen w-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div class="py-4 sm:py-6 sm:pb-28 mb-24">
        <PageHeader v-if="layoutShowHeader" :user-menu-items="pageHeader.userMenuItems" />
        <slot />
      </div>

    <DesktopBottomNav v-if="showBottomNav" />
  </div>
  
</template>

<script lang="ts" setup>
// Hide the desktop bottom nav on full-screen illustration pages (e.g. /illustrations/:slug)
import { computed } from 'vue'
import PageHeader from '~/components/PageHeader.vue'
import usePageHeader from '~/composables/usePageHeader'
const route = useRoute()
const pageHeader = usePageHeader()
const showBottomNav = computed(() => {
  // Hide only when path matches /illustrations/:slug (no trailing segments)
  return !/^\/illustrations\/[^^/]+$/.test(route.path)
})

// Hide page header for full-screen illustration pages as well
const layoutShowHeader = computed(() => {
  // pageHeader.showHeader is a ref -> use .value so the show flag actually affects the computed value
  return pageHeader.showHeader.value === false ? false : !/^\/illustrations\/[^^/]+$/.test(route.path)
})
</script>
