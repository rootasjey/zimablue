<template>
  <div class="frame">
    <!-- Header -->
    <header class="mt-12 mb-8">
      <div class="flex gap-2">
        <ULink to="/" class="hover:scale-102 active:scale-99 transition">
          <span class="i-ph-house-simple-duotone"></span>
        </ULink>
        <span>•</span>
        <h1 class="font-body text-xl font-600 text-gray-800 dark:text-gray-200">
          User Profile
        </h1>
      </div>
      <div class="w-40 flex text-center justify-center my-2">
        <div class="w-full h-2">
          <svg viewBox="0 0 300 10" preserveAspectRatio="none">
            <path d="M 0 5 Q 15 0, 30 5 T 60 5 T 90 5 T 120 5 T 150 5 T 180 5 T 210 5 T 240 5 T 270 5 T 300 5"
              stroke="currentColor" fill="none" class="text-gray-300 dark:text-gray-700" stroke-width="1" />
          </svg>
        </div>
      </div>
    </header>

    <!-- User Info Section -->
    <section class="mb-12" v-if="loggedIn">
      <h2 class="text-lg font-500 text-gray-800 dark:text-gray-200 mb-4">
        <span class="i-ph-user-circle mr-2"></span>
        <span class="font-600">{{ user?.name }}</span>
      </h2>
      
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <span class="i-ph-user text-white text-2xl"></span>
          </div>
          <div>
            <h3 class="text-md font-600 text-gray-800 dark:text-gray-200">
              {{ user?.email || 'User' }}
            </h3>
            <p class="text-size-3.5 text-gray-500 dark:text-gray-400">
              Member since {{ formatDate(user?.createdAt || '') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- User Statistics -->
    <section class="mb-12" v-if="loggedIn">
      <h2 class="text-lg font-500 text-gray-800 dark:text-gray-200 mb-4">
        <span class="i-ph-chart-bar mr-2"></span>
        Your Gallery Stats
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="i-ph-image text-blue-500 text-xl"></div>
            <div>
              <p class="text-2xl font-600 text-gray-800 dark:text-gray-200">{{ userStats.totalImages }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Total Images</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="i-ph-folder text-green-500 text-xl"></div>
            <div>
              <p class="text-2xl font-600 text-gray-800 dark:text-gray-200">{{ userStats.totalCollections }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Collections</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="i-ph-upload text-purple-500 text-xl"></div>
            <div>
              <p class="text-2xl font-600 text-gray-800 dark:text-gray-200">{{ userStats.recentUploads }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Recent Uploads</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Activity -->
    <section class="mb-12" v-if="loggedIn">
      <h2 class="text-lg font-500 text-gray-800 dark:text-gray-200 mb-4">
        <span class="i-ph-clock-clockwise mr-2"></span>
        Recent Activity
      </h2>
      
      <div class="space-y-3">
        <div 
          v-for="activity in recentActivity" 
          :key="activity.id"
          class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div :class="activity.icon" class="text-lg" :style="`color: ${activity.color}`"></div>
          <div class="flex-1">
            <p class="text-sm text-gray-800 dark:text-gray-200">{{ activity.description }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(activity.timestamp) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Account Settings -->
    <section class="mb-12" v-if="loggedIn">
      <h2 class="text-lg font-500 text-gray-800 dark:text-gray-200 mb-4">
        <span class="i-ph-gear mr-2"></span>
        Account Settings
      </h2>
      
      <div class="space-y-4">        
        <UButton 
          btn="soft-red"
          size="sm"
          @click="handleSignOut"
        >
          <span class="i-ph-sign-out"></span>
          Sign Out
        </UButton>
      </div>
    </section>

    <!-- Not Logged In State -->
    <section v-if="!loggedIn" class="text-center py-12">
      <div class="i-ph-user-circle-x text-6xl text-gray-400 dark:text-gray-600 mb-4"></div>
      <h2 class="text-xl font-600 text-gray-800 dark:text-gray-200 mb-2">
        Please Sign In
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        You need to be 
        <ULink to="/login" class="underline underline-dashed decoration-offset-6 hover:underline-rose hover:text-rose-5">signed in</ULink> 
        to view your profile and manage your gallery.
      </p>
      <ULink to="/" class="arrow">
        <span>Go back to gallery</span>
      </ULink>
    </section>

    <Footer />
  </div>
</template>

<script lang="ts" setup>
const { loggedIn, user, clear } = useUserSession()
const { toast } = useToast()

// User statistics
const userStats = ref({
  totalImages: 0,
  totalCollections: 0,
  recentUploads: 0
})

// Recent activity mock data
const recentActivity = ref([
  {
    id: 1,
    icon: 'i-ph-upload',
    color: '#3B82F6',
    description: 'Uploaded 3 new images',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: 2,
    icon: 'i-ph-folder-plus',
    color: '#10B981',
    description: 'Created new collection "Nature"',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    id: 3,
    icon: 'i-ph-pencil',
    color: '#F59E0B',
    description: 'Updated image metadata',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  }
])

// Fetch user statistics
const fetchUserStats = async () => {
  if (!loggedIn.value) return
  
  try {
    const { data } = await $fetch('/api/user/stats')
    if (data) {
      userStats.value = data
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
  }
}

// Format date helper
const formatDate = (date: string | Date) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Handle sign out
const handleSignOut = async () => {
  try {
    await clear()
    toast({
      title: 'Signed Out',
      description: 'You have been successfully signed out.',
      toast: 'soft-success',
      duration: 3000
    })
    await navigateTo('/')
  } catch (error) {
    console.error('Error signing out:', error)
    toast({
      title: 'Error',
      description: 'Failed to sign out. Please try again.',
      toast: 'soft-error',
      duration: 3000
    })
  }
}

// Load data on mount
onMounted(() => {
  if (loggedIn.value) {
    fetchUserStats()
  }
})

watch(loggedIn, (newValue) => {
  if (newValue) {
    fetchUserStats()
    return
  }

  userStats.value = {
    totalImages: 0,
    totalCollections: 0,
    recentUploads: 0
  }
})
</script>

<style scoped>
.frame {
  width: 600px;
  border-radius: 0.75rem;
  padding: 2rem;
  padding-bottom: 38vh;
  display: flex;
  flex-direction: column;
  transition-property: all;
  transition-duration: 500ms;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .frame {
    width: 100%;
    padding: 1rem;
  }
}
</style>