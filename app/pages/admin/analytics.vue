<template>
  <div class="space-y-6">
    <section class="admin-card overflow-hidden border-none bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,245,244,0.94))] p-5 shadow-sm dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.98),rgba(17,24,39,0.94))] sm:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.22em] text-stone-400 dark:text-zinc-500">Signals</p>
          <h2 class="mt-2 font-title text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Gallery reach and content momentum</h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-stone-500 dark:text-zinc-400">
            See whether the gallery is growing, which work attracts attention, and where new uploads are actually changing the pace.
          </p>
        </div>

        <button
          class="inline-flex h-11 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          :class="{ 'opacity-70 cursor-wait': isRefreshing }"
          :disabled="isRefreshing"
          @click="refreshAll"
        >
          <span class="i-ph-arrows-clockwise text-base" :class="{ 'animate-spin': isRefreshing }"></span>
          Refresh analytics
        </button>
      </div>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminStatsCard title="New users" :value="userGrowth.this_month" icon="i-ph-users-three" icon-color="emerald" :change="Math.round(userGrowth.percentage_change)" change-label="vs last month" :sparkline="[Math.max(userGrowth.last_month, 1), Math.max(userGrowth.this_month, 1), Math.max(userGrowth.total, 1)]" />
      <AdminStatsCard title="Uploads" :value="contentActivity.last_30_days" icon="i-ph-image" icon-color="amber" :sub-label="`${contentActivity.last_7_days} in the last 7 days`" :sparkline="[Math.max(contentActivity.last_7_days, 1), Math.max(contentActivity.last_30_days, 1), Math.max(contentActivity.total, 1)]" />
      <AdminStatsCard title="Top image views" :value="topImages[0]?.stats_views ?? 0" icon="i-ph-eye" icon-color="cyan" :sub-label="topImages[0]?.name || 'No image data yet'" :sparkline="topImagesSparkline" />
      <AdminStatsCard title="Top collection views" :value="topCollections[0]?.stats_views ?? 0" icon="i-ph-folders" icon-color="rose" :sub-label="topCollections[0]?.name || 'No collection data yet'" :sparkline="topCollectionsSparkline" />
    </section>

    <!-- Charts row -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- User Growth Chart -->
      <AdminChart
        type="bar"
        title="User Growth"
        description="Monthly new user registrations"
        :chart-data="userGrowthChartData"
        :height="200"
      >
        <template #actions>
          <div v-if="isLoadingUserGrowth" class="i-ph-spinner-gap animate-spin text-stone-400"></div>
          <div v-else class="flex items-center gap-1.5">
            <span class="text-xs font-medium"
              :class="userGrowth.percentage_change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
              {{ userGrowth.percentage_change >= 0 ? '+' : '' }}{{ userGrowth.percentage_change }}%
            </span>
            <span class="text-xs text-stone-400 dark:text-zinc-500">vs last month</span>
          </div>
        </template>
      </AdminChart>

      <!-- Content Activity Chart -->
      <AdminChart
        type="bar"
        title="Content Activity"
        description="Images uploaded over time"
        :chart-data="contentActivityChartData"
        :height="200"
      >
        <template #actions>
          <div v-if="isLoadingContentActivity" class="i-ph-spinner-gap animate-spin text-stone-400"></div>
          <span v-else class="text-xs text-stone-400 dark:text-zinc-500">{{ contentActivity.total }} total</span>
        </template>
      </AdminChart>
    </div>

    <!-- Top Content row -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Top Images -->
      <div class="admin-card p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-title">Top Images</h3>
            <p class="text-xs text-stone-400 dark:text-zinc-500 mt-0.5">Best performing illustrations</p>
          </div>
          <select v-model="imageMetricValue" class="h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs text-zinc-700 outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300" @change="fetchTopImages">
            <option v-for="opt in metricOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <div v-if="isLoadingTopImages" class="space-y-2">
          <div v-for="n in 5" :key="n" class="h-14 rounded-lg bg-stone-100 dark:bg-zinc-800 animate-pulse"></div>
        </div>

        <div v-else-if="topImages.length === 0" class="py-8 text-center text-sm text-stone-400 dark:text-zinc-500">
          No data available
        </div>

        <div v-else class="space-y-1">
          <NuxtLink
            v-for="(image, index) in topImages"
            :key="image.id"
            :to="`/illustrations/${image.slug}`"
            target="_blank"
            class="flex items-center gap-3 rounded-2xl p-3 transition-colors group hover:bg-stone-50 dark:hover:bg-zinc-800/60"
          >
            <span class="w-5 h-5 text-[10px] font-bold text-stone-400 dark:text-zinc-500 flex items-center justify-center flex-shrink-0">
              {{ index + 1 }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{{ image.name }}</p>
              <p class="text-xs text-stone-400 dark:text-zinc-500">{{ formatMetricValue(image, imageMetricValue) }}</p>
            </div>
            <span class="i-ph-arrow-square-out text-stone-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm"></span>
          </NuxtLink>
        </div>
      </div>

      <!-- Top Collections -->
      <div class="admin-card p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-title">Top Collections</h3>
            <p class="text-xs text-stone-400 dark:text-zinc-500 mt-0.5">Best performing collections</p>
          </div>
          <select v-model="collectionMetricValue" class="h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs text-zinc-700 outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300" @change="fetchTopCollections">
            <option v-for="opt in metricOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <div v-if="isLoadingTopCollections" class="space-y-2">
          <div v-for="n in 5" :key="n" class="h-14 rounded-lg bg-stone-100 dark:bg-zinc-800 animate-pulse"></div>
        </div>

        <div v-else-if="topCollections.length === 0" class="py-8 text-center text-sm text-stone-400 dark:text-zinc-500">
          No data available
        </div>

        <div v-else class="space-y-1">
          <NuxtLink
            v-for="(collection, index) in topCollections"
            :key="collection.id"
            :to="`/collections/${collection.slug}`"
            target="_blank"
            class="flex items-center gap-3 rounded-2xl p-3 transition-colors group hover:bg-stone-50 dark:hover:bg-zinc-800/60"
          >
            <span class="w-5 h-5 text-[10px] font-bold text-stone-400 dark:text-zinc-500 flex items-center justify-center flex-shrink-0">
              {{ index + 1 }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{{ collection.name }}</p>
              <p class="text-xs text-stone-400 dark:text-zinc-500">{{ formatMetricValue(collection, collectionMetricValue) }}</p>
            </div>
            <span class="i-ph-arrow-square-out text-stone-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm"></span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Top Tags -->
    <div class="admin-card p-5">
      <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-title mb-4">Most Used Tags</h3>

      <div v-if="isLoadingTopTags" class="flex flex-wrap gap-2">
        <div v-for="n in 8" :key="n" class="h-7 rounded-full animate-pulse bg-stone-100 dark:bg-zinc-800" :style="{ width: `${60 + n * 8}px` }"></div>
      </div>

      <div v-else-if="topTags.length === 0" class="py-8 text-center text-sm text-stone-400 dark:text-zinc-500">
        No tags found
      </div>

      <div v-else class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="tag in topTags"
          :key="tag.id"
          :to="`/tags/${tag.slug}`"
          target="_blank"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity"
          :style="{ backgroundColor: tag.color || '#6B7280', color: '#fff' }"
        >
          {{ tag.name }}
          <span class="opacity-70">({{ tag.usage_count }})</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { toast } = useToast()
const fetchAdmin = $fetch as (url: string, options?: Record<string, any>) => Promise<any>

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

const imageMetricValue = ref('views')
const collectionMetricValue = ref('views')

const metricOptions = [
  { label: 'Views', value: 'views' },
  { label: 'Likes', value: 'likes' },
  { label: 'Downloads', value: 'downloads' }
]

const topImagesSparkline = computed(() => topImages.value.slice(0, 4).map((item) => Math.max(item.stats_views ?? 0, 1)))
const topCollectionsSparkline = computed(() => topCollections.value.slice(0, 4).map((item) => Math.max(item.stats_views ?? 0, 1)))

// Chart data
const userGrowthChartData = computed(() => ({
  labels: ['Last Month', 'This Month'],
  datasets: [{
    label: 'New Users',
    data: [userGrowth.value.last_month, userGrowth.value.this_month],
    backgroundColor: ['rgba(120, 113, 108, 0.6)', 'rgba(245, 158, 11, 0.75)'],
    borderRadius: 8,
    borderSkipped: false,
  }]
}))

const contentActivityChartData = computed(() => ({
  labels: ['Last 7 Days', 'Last 30 Days', 'Total'],
  datasets: [{
    label: 'Images',
    data: [contentActivity.value.last_7_days, contentActivity.value.last_30_days, contentActivity.value.total],
    backgroundColor: ['rgba(6, 182, 212, 0.65)', 'rgba(139, 92, 246, 0.65)', 'rgba(52, 211, 153, 0.65)'],
    borderRadius: 8,
    borderSkipped: false,
  }]
}))

// Fetch functions
const fetchUserGrowth = async () => {
  isLoadingUserGrowth.value = true
  try {
    const res = await fetchAdmin('/api/admin/analytics/user-growth') as any
    if (res?.success) userGrowth.value = res.data
  } catch (e) {
    console.error('Failed to load user growth:', e)
  } finally {
    isLoadingUserGrowth.value = false
  }
}

const fetchContentActivity = async () => {
  isLoadingContentActivity.value = true
  try {
    const res = await fetchAdmin('/api/admin/analytics/content-activity') as any
    if (res?.success) contentActivity.value = res.data
  } catch (e) {
    console.error('Failed to load content activity:', e)
  } finally {
    isLoadingContentActivity.value = false
  }
}

const fetchTopImages = async () => {
  isLoadingTopImages.value = true
  try {
    const res = await fetchAdmin(`/api/admin/analytics/top-images?metric=${imageMetricValue.value}&limit=5`) as any
    if (res?.success) topImages.value = res.data
  } catch (e) {
    console.error('Failed to load top images:', e)
  } finally {
    isLoadingTopImages.value = false
  }
}

const fetchTopCollections = async () => {
  isLoadingTopCollections.value = true
  try {
    const res = await fetchAdmin(`/api/admin/analytics/top-collections?metric=${collectionMetricValue.value}&limit=5`) as any
    if (res?.success) topCollections.value = res.data
  } catch (e) {
    console.error('Failed to load top collections:', e)
  } finally {
    isLoadingTopCollections.value = false
  }
}

const fetchTopTags = async () => {
  isLoadingTopTags.value = true
  try {
    const res = await fetchAdmin('/api/admin/analytics/top-tags?limit=15') as any
    if (res?.success) topTags.value = res.data
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
  toast({ title: 'Refreshed', description: 'Analytics updated.', toast: 'soft-success', duration: 3000 })
}

const formatMetricValue = (item: any, metric: string) => {
  const value = metric === 'likes' ? item.stats_likes
    : metric === 'downloads' ? item.stats_downloads
    : item.stats_views
  const label = metric === 'likes' ? 'likes' : metric === 'downloads' ? 'downloads' : 'views'
  return `${(value ?? 0).toLocaleString()} ${label}`
}

onMounted(() => {
  fetchUserGrowth()
  fetchContentActivity()
  fetchTopImages()
  fetchTopCollections()
  fetchTopTags()
})
</script>
