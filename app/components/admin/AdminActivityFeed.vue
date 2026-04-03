<template>
  <div class="admin-card p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-body">Recent Activity</h3>
      <button
        class="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
        :class="{ 'animate-spin': loading }"
        @click="refresh"
        title="Refresh"
      >
        <span class="i-ph-arrow-clockwise text-sm"></span>
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="flex flex-col gap-3">
      <div
        v-for="i in 5"
        :key="i"
        class="flex items-start gap-3 animate-pulse"
      >
        <div class="w-7 h-7 rounded-lg bg-stone-200 dark:bg-zinc-800 flex-shrink-0"></div>
        <div class="flex-1">
          <div class="h-3 bg-stone-200 dark:bg-zinc-800 rounded w-3/4 mb-1.5"></div>
          <div class="h-2.5 bg-stone-100 dark:bg-zinc-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!activities.length" class="py-8 text-center">
      <span class="i-ph-activity text-3xl text-stone-300 dark:text-zinc-600 block mx-auto mb-2"></span>
      <p class="text-xs text-stone-400 dark:text-zinc-500">No recent activity</p>
    </div>

    <!-- Activity list -->
    <div v-else class="flex flex-col gap-0.5">
      <div
        v-for="(item, i) in activities"
        :key="i"
        class="flex items-start gap-3 px-2 py-2 rounded-xl hover:bg-stone-50 dark:hover:bg-zinc-800/60 transition-colors group"
      >
        <!-- Icon badge -->
        <div :class="['w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', iconBg(item.type)]">
          <span :class="[activityIcon(item.type), 'text-xs', iconColor(item.type)]"></span>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p class="text-xs text-zinc-800 dark:text-zinc-200 leading-snug flex flex-wrap items-baseline">
            <span class="font-medium mr-1">{{ item.actor }}</span>
            <span class="text-stone-500 dark:text-zinc-400 mr-1">{{ item.action }}</span>
            <span class="font-medium truncate">{{ item.target }}</span>
          </p>
          <p class="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">
            {{ formatRelativeTime(item.createdAt) }} · {{ formatAbsoluteDate(item.createdAt) }}
          </p>
        </div>
      </div>
    </div>

    <!-- View all link -->
    <div v-if="activities.length" class="mt-3 pt-3 border-t border-stone-100 dark:border-zinc-800">
      <NuxtLink
        to="/admin/analytics"
        class="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-colors"
      >
        View all activity
        <span class="i-ph-arrow-right text-xs"></span>
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface ActivityItem {
  type: 'image' | 'collection' | 'message' | 'user' | 'tag'
  actor: string
  action: string
  target: string
  createdAt: string
}

const activities = ref<ActivityItem[]>([])
const loading = ref(false)

const typeConfig: Record<string, { icon: string; bg: string; color: string }> = {
  image:      { icon: 'i-ph-image-duotone',      bg: 'bg-amber-100 dark:bg-amber-900/30',   color: 'text-amber-600 dark:text-amber-400' },
  collection: { icon: 'i-ph-folder-duotone',     bg: 'bg-cyan-100 dark:bg-cyan-900/30',     color: 'text-cyan-600 dark:text-cyan-400' },
  message:    { icon: 'i-ph-envelope-duotone',   bg: 'bg-rose-100 dark:bg-rose-900/30',     color: 'text-rose-600 dark:text-rose-400' },
  user:       { icon: 'i-ph-user-circle-duotone', bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
  tag:        { icon: 'i-ph-tag-duotone',         bg: 'bg-stone-100 dark:bg-zinc-800',       color: 'text-stone-500 dark:text-zinc-400' },
}

const activityIcon = (type: string) => typeConfig[type]?.icon ?? 'i-ph-clock'
const iconBg = (type: string) => typeConfig[type]?.bg ?? 'bg-stone-100 dark:bg-zinc-800'
const iconColor = (type: string) => typeConfig[type]?.color ?? 'text-stone-400'

const formatRelativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const safeDiff = diff < 0 ? 0 : diff
  const mins = Math.floor(safeDiff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(days / 365)
  return `${years}yr ago`
}

const formatAbsoluteDate = (iso: string) => {
  const date = new Date(iso)
  // Use en-US for short month names: Jan, Feb, etc.
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const refresh = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/admin/activity') as any
    if (res?.data) activities.value = res.data
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>
