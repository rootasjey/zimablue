<template>
  <!-- Mobile Bottom Navigation Bar -->
  <nav 
    class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 sm:hidden z-50"
    role="navigation"
    aria-label="Mobile navigation"
  >
    <div class="flex justify-around items-center py-2 px-4 safe-area-pb">
      <!-- Home -->
      <NuxtLink 
        to="/" 
        class="mobile-nav-item"
        :class="{ 'mobile-nav-item-active': isActive('/') }"
        aria-label="Home"
      >
        <div class="mobile-nav-icon">
          <i class="i-ph-house-simple text-xl"></i>
        </div>
        <span class="mobile-nav-label">Home</span>
      </NuxtLink>

      <!-- Collections -->
      <NuxtLink 
        to="/collections" 
        class="mobile-nav-item"
        :class="{ 'mobile-nav-item-active': isActive('/collections') }"
        aria-label="Collections"
      >
        <div class="mobile-nav-icon">
          <i class="i-ph-folder-simple text-xl"></i>
        </div>
        <span class="mobile-nav-label">Collections</span>
      </NuxtLink>

      <!-- Search -->
      <NuxtLink
        to="/search"
        class="mobile-nav-item"
        :class="{ 'mobile-nav-item-active': isActive('/search') }"
        aria-label="Search"
      >
        <div class="mobile-nav-icon">
          <i class="i-ph-magnifying-glass text-xl"></i>
        </div>
        <span class="mobile-nav-label">Search</span>
      </NuxtLink>

      <!-- About -->
      <NuxtLink 
        to="/about" 
        class="mobile-nav-item"
        :class="{ 'mobile-nav-item-active': isActive('/about') }"
        aria-label="About"
      >
        <div class="mobile-nav-icon">
          <i class="i-ph-info text-xl"></i>
        </div>
        <span class="mobile-nav-label">About</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script lang="ts" setup>
const route = useRoute()

// Check if current route is active
const isActive = (path: string): boolean => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<style scoped>
.mobile-nav-item {
  @apply flex flex-col items-center justify-center p-2 min-w-16 min-h-16 rounded-lg transition-all duration-200;
  @apply text-gray-600 dark:text-gray-400;
  @apply hover:text-gray-800 dark:hover:text-gray-200;
  @apply hover:bg-gray-100 dark:hover:bg-gray-800;
  @apply active:scale-95;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

.mobile-nav-item-active {
  @apply text-blue-600 dark:text-blue-400;
  @apply bg-blue-50 dark:bg-blue-900/20;
}

.mobile-nav-icon {
  @apply flex items-center justify-center w-6 h-6 mb-1;
}

.mobile-nav-label {
  @apply text-xs font-medium leading-none;
}

/* Safe area for devices with home indicator */
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Ensure proper touch targets */
@media (max-width: 640px) {
  .mobile-nav-item {
    min-height: 44px;
    min-width: 44px;
  }
}
</style>
