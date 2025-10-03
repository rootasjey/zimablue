<template>
  <div class="flex min-h-screen min-w-screen bg-[#E0ECF2]">
    <!-- Custom Sidebar -->
    <AdminSidebar :unread-count="unreadCount" />

    <!-- Main Content Area -->
    <main class="flex-1 min-h-screen md:ml-0">
      <div class="p-4 md:p-6">
        <!-- Base background wrapper to mirror design reference -->
        <div class="min-h-[calc(100vh-3rem)] rounded-[28px] p-4 md:p-6">
          <slot />
        </div>
      </div>
    </main>
  </div>
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
