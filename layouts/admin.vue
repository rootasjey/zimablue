<template>
  <USidebarProvider class="min-h-screen">
    <div class="flex">
      <AdminSidebar :unread-count="unreadCount" />

      <USidebarInset class="flex-1 min-h-screen">
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
