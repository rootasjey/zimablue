<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="flex">
      <!-- Sidebar -->
      <AdminSidebar :unread-count="stats?.messages.unread || 0" />
      
      <!-- Main Content -->
      <main class="flex-1 p-8">
        <!-- Access Control -->
        <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
          <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Access Denied</h2>
          <p class="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
          <UButton to="/user" class="mt-4">Go to Profile</UButton>
        </div>

        <!-- Dashboard Content -->
        <div v-else>
          <!-- Header -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {{ user?.name }}. Here's what's happening with your platform.
            </p>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p class="text-gray-600 dark:text-gray-400 mt-4">Loading dashboard...</p>
          </div>

          <!-- Stats Grid -->
          <div v-else-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AdminStatsCard
              title="Total Users"
              :value="stats.users.total"
              icon="i-ph-users-duotone"
              icon-color="text-white"
              icon-bg-color="bg-blue-500"
            />
            
            <AdminStatsCard
              title="Total Images"
              :value="stats.images.total"
              icon="i-ph-image-duotone"
              icon-color="text-white"
              icon-bg-color="bg-green-500"
            />
            
            <AdminStatsCard
              title="Collections"
              :value="stats.collections.total"
              icon="i-ph-folder-duotone"
              icon-color="text-white"
              icon-bg-color="bg-purple-500"
            />
            
            <AdminStatsCard
              title="Unread Messages"
              :value="stats.messages.unread"
              icon="i-ph-envelope-duotone"
              icon-color="text-white"
              icon-bg-color="bg-red-500"
            />
          </div>

          <!-- Detailed Stats -->
          <div v-if="stats" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- User Stats -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Statistics</h3>
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Total Users</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ stats.users.total }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Admin Users</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ stats.users.admins }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">New This Month</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ stats.users.newThisMonth }}</span>
                </div>
              </div>
            </div>

            <!-- Content Stats -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Statistics</h3>
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Total Views</span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ (stats.images.totalViews + stats.collections.totalViews).toLocaleString() }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Total Downloads</span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ stats.images.totalDownloads.toLocaleString() }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Total Likes</span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ stats.images.totalLikes.toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <UButton to="/admin/users" btn="soft-blue" class="justify-start">
                <span class="i-ph-users-duotone mr-2"></span>
                Manage Users
              </UButton>
              
              <UButton to="/admin/images" btn="soft-green" class="justify-start">
                <span class="i-ph-image-duotone mr-2"></span>
                Manage Images
              </UButton>
              
              <UButton to="/admin/collections" btn="soft-purple" class="justify-start">
                <span class="i-ph-folder-duotone mr-2"></span>
                Manage Collections
              </UButton>
              
              <UButton to="/admin/messages" btn="soft-red" class="justify-start">
                <span class="i-ph-envelope-duotone mr-2"></span>
                View Messages
                <span v-if="stats?.messages.unread && stats?.messages.unread > 0" class="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {{ stats?.messages.unread }}
                </span>
              </UButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { AdminStats } from '~/types/admin'

const { loggedIn, user } = useUserSession()
const { toast } = useToast()

definePageMeta({
  middleware: 'authenticated'
})

const stats = ref<AdminStats | null>(null)
const isLoading = ref(false)

const fetchStats = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return
  
  isLoading.value = true
  try {
    const response = await $fetch('/api/admin/stats')
    if (response.success) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    toast({
      title: 'Error',
      description: 'Failed to fetch dashboard statistics. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (loggedIn.value && user.value?.role === 'admin') {
    fetchStats()
  }
})

watch([loggedIn, () => user.value?.role], ([newLoggedIn, newRole]) => {
  if (newLoggedIn && newRole === 'admin') {
    fetchStats()
  }
})
</script>
