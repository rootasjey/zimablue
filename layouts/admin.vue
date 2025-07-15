<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="flex">
      <!-- Sidebar -->
      <AdminSidebar :unread-count="unreadCount" />
      
      <!-- Main Content -->
      <main class="flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
// This could fetch unread count globally for the admin layout
const unreadCount = ref(0)

// Fetch unread messages count for sidebar badge
const fetchUnreadCount = async () => {
  try {
    const response = await $fetch('/api/admin/messages?limit=1&read=false')
    if (response.success) {
      unreadCount.value = response.data.pagination.total
    }
  } catch (error) {
    // Silently fail - not critical for layout
    console.warn('Failed to fetch unread count:', error)
  }
}

onMounted(() => {
  fetchUnreadCount()
})
</script>
