<template>
  <div>
    <!-- Access Control -->
    <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
      <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Access Denied</h2>
      <p class="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
      <NButton to="/user" class="mt-4">Go to Profile</NButton>
    </div>

    <!-- Analytics Dashboard -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-700 text-gray-900 dark:text-gray-200">Analytics</h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1">Insights and performance metrics for your content</p>
        </div>
        <NButton @click="refreshAll" :loading="isRefreshing" btn="light:soft-blue dark:solid-gray" rounded="6" size="xs">
          <NIcon name="i-ph-arrows-clockwise" class="mr-2" />
          <span>Refresh</span>
        </NButton>
      </div>

        <div class="flex flex-wrap gap-6">
        <!-- User Growth Card -->
        <div class="rounded-[28px] p-6 bg-[#D1E0E9] dark:bg-gray-800">
          <div class="flex items-center justify-between mb-4">
            <div class="text-lg font-700 text-gray-900 dark:text-gray-200">User Growth</div>
            <span class="i-ph-users text-2xl text-gray-600 dark:text-gray-300"></span>
          </div>

          <div v-if="isLoadingUserGrowth" class="h-24 bg-white/50 rounded-xl animate-pulse"></div>

          <div v-else class="grid grid-cols-3 gap-4">
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">This Month</div>
              <div class="text-2xl font-700 text-gray-900 dark:text-gray-200">{{ userGrowth.this_month }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">Last Month</div>
              <div class="text-2xl font-700 text-gray-900 dark:text-gray-200">{{ userGrowth.last_month }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">Change</div>
              <div class="text-2xl font-700"
                :class="userGrowth.percentage_change >= 0 ? 'text-emerald-600' : 'text-red-600'">
                {{ userGrowth.percentage_change >= 0 ? '+' : '' }}{{ userGrowth.percentage_change }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Content Activity Card -->
        <div class="rounded-[28px] p-6 bg-[#D1E0E9] dark:bg-gray-800">
          <div class="flex items-center justify-between mb-4">
            <div class="text-lg font-700 text-gray-900 dark:text-gray-200">Content Activity</div>
            <span class="i-ph-image text-2xl text-gray-600 dark:text-gray-300"></span>
          </div>

          <div v-if="isLoadingContentActivity" class="h-24 bg-white/50 rounded-xl animate-pulse"></div>

          <div v-else class="grid grid-cols-3 gap-4">
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">Last 7 Days</div>
              <div class="text-2xl font-700 text-gray-900 dark:text-gray-200">{{ contentActivity.last_7_days }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">Last 30 Days</div>
              <div class="text-2xl font-700 text-gray-900 dark:text-gray-200">{{ contentActivity.last_30_days }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Images</div>
              <div class="text-2xl font-700 text-gray-900 dark:text-gray-200">{{ contentActivity.total }}</div>
            </div>
          </div>
        </div>

        <!-- Top Tags -->
        <div class="rounded-[28px] p-6 bg-[#D1E0E9] dark:bg-gray-800">
          <div class="text-lg font-700 text-gray-900 dark:text-gray-200 mb-4">Most Used Tags</div>

          <div v-if="isLoadingTopTags" class="h-32 bg-white/50 rounded-xl animate-pulse"></div>

          <div v-else-if="topTags.length === 0" class="text-center py-8 text-gray-500">
            No tags found
          </div>

          <div v-else class="flex flex-wrap gap-3">
            <NuxtLink v-for="tag in topTags" :key="tag.id" :to="`/tags/${tag.slug}`" target="_blank"
              class="px-4 py-2 rounded-full font-600 text-sm hover:opacity-80 transition flex items-center gap-2"
              :style="{ backgroundColor: tag.color || '#6B7280', color: '#FFFFFF' }">
              {{ tag.name }}
              <span class="opacity-75">({{ tag.usage_count }})</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Top Performing Content -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Images -->
        <div class="rounded-[28px] p-6 bg-[#D1E0E9] dark:bg-gray-800">
          <div class="flex items-center gap-6 justify-between mb-4">
            <div class="shrink-0 text-lg font-700 text-gray-900 dark:text-gray-200">Top Images</div>
            <div>
              <NSelect v-model="imageMetric" :items="metricOptions" item-key="label" value-key="label" size="sm"
                select="light:soft-blue dark:soft-gray" @change="fetchTopImages" :una="{ selectTrigger: 'rounded-6!' }" />
            </div>
          </div>

          <div v-if="isLoadingTopImages" class="space-y-3">
            <div v-for="n in 5" :key="n" class="h-16 bg-white/50 rounded-xl animate-pulse"></div>
          </div>

          <div v-else-if="topImages.length === 0" class="text-center py-8 text-gray-500">
            No images found
          </div>

          <div v-else class="space-y-3">
            <NuxtLink v-for="(image, index) in topImages" :key="image.id" :to="`/illustrations/${image.slug}`"
              target="_blank"
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition cursor-pointer">
              <div
                class="w-8 h-8 rounded-full bg-black text-gray-200 flex items-center justify-center font-700 text-sm flex-shrink-0">
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-600 text-gray-900 dark:text-gray-200 truncate">{{ image.name }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-300">
                  {{ formatMetricValue(image, imageMetric.value) }}
                </div>
              </div>
              <NIcon name="i-ph-arrow-square-out-bold" />
            </NuxtLink>
          </div>
        </div>

        <!-- Top Collections -->
        <div class="rounded-[28px] p-6 bg-[#D1E0E9] dark:bg-gray-800">
          <div class="flex items-center justify-between gap-6 mb-4">
            <div class="shrink-0 text-lg font-700 text-gray-900 dark:text-gray-200">Top Collections</div>
            <div>
              <NSelect v-model="collectionMetric" :items="metricOptions" item-key="label" value-key="label" size="sm"
                select="light:soft-blue dark:soft-gray" @change="fetchTopCollections" :una="{ selectTrigger: 'rounded-6!' }" />
            </div>
          </div>

          <div v-if="isLoadingTopCollections" class="space-y-3">
            <div v-for="n in 5" :key="n" class="h-16 bg-white/50 rounded-xl animate-pulse"></div>
          </div>

          <div v-else-if="topCollections.length === 0" class="text-center py-8 text-gray-500">
            No collections found
          </div>

          <div v-else class="space-y-3">
            <NuxtLink v-for="(collection, index) in topCollections" :key="collection.id"
              :to="`/collections/${collection.slug}`" target="_blank"
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition cursor-pointer">
              <div
                class="w-8 h-8 rounded-full bg-black text-gray-200 flex items-center justify-center font-700 text-sm flex-shrink-0">
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-600 text-gray-900 dark:text-gray-200 truncate">{{ collection.name }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-300">
                  {{ formatMetricValue(collection, collectionMetric.value) }}
                </div>
              </div>
              <NIcon name="i-ph-arrow-square-out-bold" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { loggedIn, user } = useUserSession()
const { toast } = useToast()

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

// State
const isRefreshing = ref(false)
const isLoadingUserGrowth = ref(false)
const isLoadingContentActivity = ref(false)
const isLoadingTopImages = ref(false)
const isLoadingTopCollections = ref(false)
const isLoadingTopTags = ref(false)

const userGrowth = ref({
  this_month: 0,
  last_month: 0,
  total: 0,
  percentage_change: 0
})

const contentActivity = ref({
  last_7_days: 0,
  last_30_days: 0,
  total: 0
})

const topImages = ref<any[]>([])
const topCollections = ref<any[]>([])
const topTags = ref<any[]>([])

const imageMetric = ref({label: 'Views', value: 'views'})
const collectionMetric = ref({label: 'Views', value: 'views'})

const metricOptions = [
  { label: 'Views', value: 'views' },
  { label: 'Likes', value: 'likes' },
  { label: 'Downloads', value: 'downloads' }
]

// Fetch functions
const fetchUserGrowth = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return
  isLoadingUserGrowth.value = true
  try {
    const res = await $fetch('/api/admin/analytics/user-growth') as any
    if (res?.success) {
      userGrowth.value = res.data
    }
  } catch (e) {
    console.error('Failed to load user growth:', e)
  } finally {
    isLoadingUserGrowth.value = false
  }
}

const fetchContentActivity = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return
  isLoadingContentActivity.value = true
  try {
    const res = await $fetch('/api/admin/analytics/content-activity') as any
    if (res?.success) {
      contentActivity.value = res.data
    }
  } catch (e) {
    console.error('Failed to load content activity:', e)
  } finally {
    isLoadingContentActivity.value = false
  }
}

const fetchTopImages = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return
  isLoadingTopImages.value = true
  try {
    const res = await $fetch(`/api/admin/analytics/top-images?metric=${imageMetric.value}&limit=5`) as any
    if (res?.success) {
      topImages.value = res.data
    }
  } catch (e) {
    console.error('Failed to load top images:', e)
  } finally {
    isLoadingTopImages.value = false
  }
}

const fetchTopCollections = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return
  isLoadingTopCollections.value = true
  try {
    const res = await $fetch(`/api/admin/analytics/top-collections?metric=${collectionMetric.value}&limit=5`) as any
    if (res?.success) {
      topCollections.value = res.data
    }
  } catch (e) {
    console.error('Failed to load top collections:', e)
  } finally {
    isLoadingTopCollections.value = false
  }
}

const fetchTopTags = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return
  isLoadingTopTags.value = true
  try {
    const res = await $fetch('/api/admin/analytics/top-tags?limit=15') as any
    if (res?.success) {
      topTags.value = res.data
    }
  } catch (e) {
    console.error('Failed to load top tags:', e)
  } finally {
    isLoadingTopTags.value = false
  }
}

const refreshAll = async () => {
  isRefreshing.value = true
  await Promise.all([
    fetchUserGrowth(),
    fetchContentActivity(),
    fetchTopImages(),
    fetchTopCollections(),
    fetchTopTags()
  ])
  isRefreshing.value = false
  toast({
    title: 'Success',
    description: 'Analytics refreshed successfully',
    toast: 'soft-success',
    duration: 3000
  })
}

// Helper function
const formatMetricValue = (item: any, metric: string) => {
  const value = metric === 'likes' ? item.stats_likes 
    : metric === 'downloads' ? item.stats_downloads 
    : item.stats_views
  
  const label = metric === 'likes' ? 'likes' 
    : metric === 'downloads' ? 'downloads' 
    : 'views'
  
  return `${value.toLocaleString()} ${label}`
}

// Initialize
onMounted(() => {
  if (loggedIn.value && user.value?.role === 'admin') {
    fetchUserGrowth()
    fetchContentActivity()
    fetchTopImages()
    fetchTopCollections()
    fetchTopTags()
  }
})
</script>

