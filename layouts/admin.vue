<template>
  <USidebarProvider class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="flex">
      <!-- UnaUI Sidebar -->
      <AdminSidebar :unread-count="unreadCount" />

      <!-- Main content area with inset -->
      <USidebarInset class="flex-1 min-h-screen">
        <!-- Top bar with trigger -->
        <div class="sticky top-0 z-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800">
          <div class="flex items-center gap-3 px-4 py-3">
            <NSidebarTrigger una="ghost" class="md:hidden" />
            <slot name="topbar"></slot>
          </div>
        </div>

        <!-- Page slot -->
        <div class="p-6 md:p-8">
          <slot />
        </div>
      </USidebarInset>
    </div>
  </USidebarProvider>
  
</template>

<script lang="ts" setup>
// Global unread counter for Messages badge
const unreadCount = ref(0)

const fetchUnreadCount = async () => {
  try {
    const response = await $fetch('/api/admin/messages?limit=1&read=false')
    if (response?.success && response?.data?.pagination?.total !== undefined) {
      unreadCount.value = response.data.pagination.total
    }
  } catch (error) {
    console.warn('Failed to fetch unread count:', error)
  }
}

onMounted(() => {
  fetchUnreadCount()
})
</script>
