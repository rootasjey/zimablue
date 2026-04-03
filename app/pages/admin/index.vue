<template>
  <div>
    <main>
      <div v-if="!loggedIn || user?.role !== 'admin'" class="admin-card p-10 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">
          <span class="i-ph-lock text-3xl"></span>
        </div>
        <h2 class="font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Access denied</h2>
        <p class="mx-auto mt-2 max-w-md text-sm text-stone-500 dark:text-zinc-400">
          You need administrator access to manage the gallery workspace.
        </p>
        <NButton to="/user" class="mt-5">Go to profile</NButton>
      </div>

      <div v-else class="space-y-6">
        <section class="mt-6 mb-12">
          <h1 class="font-classic text-3xl sm:text-8xl font-500 text-zinc-950 dark:text-zinc-50">
            Good {{ greetingTime }}, {{ firstName }}.
          </h1>
        </section>

        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatsCard
            title="Illustrations"
            :value="stats?.images.total ?? 0"
            icon="i-ph-image"
            icon-color="amber"
            :change="contentActivityChange"
            change-label="vs previous 30-day rhythm"
            :sparkline="contentSparkline"
          />
          <AdminStatsCard
            title="Collections"
            :value="stats?.collections.total ?? 0"
            icon="i-ph-folders"
            icon-color="cyan"
            :sub-label="`${stats?.collections.public ?? 0} public / ${stats?.collections.private ?? 0} private`"
            :sparkline="collectionSparkline"
          />
          <AdminStatsCard
            title="Messages"
            :value="stats?.messages.total ?? 0"
            icon="i-ph-envelope"
            icon-color="rose"
            :change="messageFreshness"
            change-label="new today"
            :sparkline="messageSparkline"
          />
          <AdminStatsCard
            title="Users"
            :value="stats?.users.total ?? 0"
            icon="i-ph-users-three"
            icon-color="emerald"
            :change="Math.round(userGrowth.percentage_change)"
            change-label="month-over-month growth"
            :sparkline="userSparkline"
          />
        </section>

        <section class="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
          <div class="admin-card p-5 sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-medium uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Studio pulse</p>
                <h2 class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">What needs attention now</h2>
              </div>
              <NuxtLink to="/admin/analytics" class="text-xs font-medium text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                Open analytics
              </NuxtLink>
            </div>

            <div class="mt-6 grid gap-4 lg:grid-cols-2">
              <div class="rounded-3xl bg-stone-50 p-4 dark:bg-zinc-900/80">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Content cadence</p>
                    <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">Uploads over the last week and month.</p>
                  </div>
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <span class="i-ph-shooting-star text-lg"></span>
                  </div>
                </div>

                <div class="mt-5 space-y-4">
                  <div>
                    <div class="mb-1 flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
                      <span>Last 7 days</span>
                      <span>{{ contentActivity.last_7_days }}</span>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
                      <div class="h-full rounded-full bg-amber-400 transition-all duration-500" :style="{ width: `${contentLastWeekWidth}%` }"></div>
                    </div>
                  </div>

                  <div>
                    <div class="mb-1 flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
                      <span>Last 30 days</span>
                      <span>{{ contentActivity.last_30_days }}</span>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
                      <div class="h-full rounded-full bg-cyan-400 transition-all duration-500" :style="{ width: `${contentLastMonthWidth}%` }"></div>
                    </div>
                  </div>

                  <div class="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    {{ cadenceInsight }}
                  </div>
                </div>
              </div>

              <div class="rounded-3xl bg-stone-50 p-4 dark:bg-zinc-900/80">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Reach snapshot</p>
                    <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">High-level engagement across the gallery.</p>
                  </div>
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                    <span class="i-ph-chart-line-up text-lg"></span>
                  </div>
                </div>

                <div class="mt-5 grid gap-3 sm:grid-cols-2">
                  <div class="rounded-2xl bg-white p-3 dark:bg-zinc-950">
                    <p class="text-xs text-stone-500 dark:text-zinc-400">Image views</p>
                    <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ formatCompact(stats?.images.totalViews ?? 0) }}</p>
                  </div>
                  <div class="rounded-2xl bg-white p-3 dark:bg-zinc-950">
                    <p class="text-xs text-stone-500 dark:text-zinc-400">Downloads</p>
                    <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ formatCompact(stats?.images.totalDownloads ?? 0) }}</p>
                  </div>
                  <div class="rounded-2xl bg-white p-3 dark:bg-zinc-950">
                    <p class="text-xs text-stone-500 dark:text-zinc-400">Likes</p>
                    <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ formatCompact(stats?.images.totalLikes ?? 0) }}</p>
                  </div>
                  <div class="rounded-2xl bg-white p-3 dark:bg-zinc-950">
                    <p class="text-xs text-stone-500 dark:text-zinc-400">Collection views</p>
                    <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ formatCompact(stats?.collections.totalViews ?? 0) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="admin-card p-5 sm:p-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-medium uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Focus block</p>
                  <h2 class="mt-2 font-classic text-xl font-semibold text-zinc-900 dark:text-zinc-100">Next task</h2>
                </div>
                <NuxtLink to="/admin/todos" class="text-xs font-medium text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                  Open tasks
                </NuxtLink>
              </div>

              <div v-if="isLoadingNextTodo" class="mt-5 h-36 animate-pulse rounded-3xl bg-stone-100 dark:bg-zinc-800"></div>

              <div v-else-if="nextTodo" class="mt-5 rounded-3xl border border-stone-200 bg-stone-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                <div class="flex items-center justify-between gap-3">
                  <span class="admin-badge py-1 text-[10px]" :class="priorityBadgeClass(nextTodo.priority)">
                    {{ nextTodo.priority }} priority
                  </span>
                  <span class="text-xs text-stone-400 dark:text-zinc-500">{{ getStatusLabel(nextTodo.status) }}</span>
                </div>
                <h3 class="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">{{ nextTodo.title }}</h3>
                <p v-if="nextTodo.description" class="mt-2 text-sm leading-6 text-stone-500 dark:text-zinc-400">{{ nextTodo.description }}</p>
                <div class="mt-4 flex items-center gap-2 text-xs text-stone-500 dark:text-zinc-400">
                  <span class="i-ph-calendar-dots"></span>
                  <span>Due {{ formatDate(nextTodo.due_date) }}</span>
                </div>
              </div>

              <div v-else class="mt-5 rounded-3xl border border-dashed border-stone-200 p-5 text-sm text-stone-500 dark:border-zinc-800 dark:text-zinc-400">
                No pending task is currently blocking the studio.
              </div>
            </div>

            <div class="admin-card p-5 sm:p-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-medium uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Inbox</p>
                  <h2 class="mt-2 font-classic text-xl font-semibold text-zinc-900 dark:text-zinc-100">Recent messages</h2>
                </div>
                <NuxtLink to="/admin/messages" class="text-xs font-medium text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                  Open inbox
                </NuxtLink>
              </div>

              <div v-if="isLoadingMessages" class="mt-5 space-y-3">
                <div v-for="n in 3" :key="n" class="h-16 animate-pulse rounded-2xl bg-stone-100 dark:bg-zinc-800"></div>
              </div>

              <div v-else-if="recentMessages.length === 0" class="mt-5 rounded-3xl border border-dashed border-stone-200 p-5 text-sm text-stone-500 dark:border-zinc-800 dark:text-zinc-400">
                No recent messages.
              </div>

              <div v-else class="mt-5 space-y-3">
                <NuxtLink
                  v-for="message in recentMessages"
                  :key="message.id"
                  to="/admin/messages"
                  class="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-900"
                >
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
                    {{ getInitials(message.sender_email) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ message.subject }}</p>
                      <span v-if="!message.read" class="h-2 w-2 rounded-full bg-amber-400"></span>
                    </div>
                    <p class="mt-1 truncate text-xs text-stone-500 dark:text-zinc-400">{{ message.sender_email }}</p>
                  </div>
                  <p class="whitespace-nowrap text-[11px] text-stone-400 dark:text-zinc-500">{{ formatRelativeDate(message.created_at) }}</p>
                </NuxtLink>
              </div>
            </div>
          </div>
        </section>

        <section class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <AdminActivityFeed />

          <div class="admin-card p-5 sm:p-6">
            <p class="text-xs font-medium uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Shortcuts</p>
            <h2 class="mt-2 font-classic text-xl font-semibold text-zinc-900 dark:text-zinc-100">Common routes</h2>

            <div class="mt-5 grid gap-3">
              <NuxtLink
                v-for="action in quickActions"
                :key="action.to"
                :to="action.to"
                class="group flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 transition-all hover:-translate-y-0.5 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-900"
              >
                <div class="flex items-center gap-3">
                  <div :class="['flex h-11 w-11 items-center justify-center rounded-2xl text-lg', action.iconClass]">
                    <span :class="action.icon"></span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ action.label }}</p>
                    <p class="text-xs text-stone-500 dark:text-zinc-400">{{ action.description }}</p>
                  </div>
                </div>
                <span class="i-ph-arrow-up-right text-stone-300 transition-colors group-hover:text-amber-500 dark:text-zinc-600 dark:group-hover:text-amber-400"></span>
              </NuxtLink>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import type { AdminStats } from '~~/shared/types/admin'
import type { Message } from '~~/shared/types/message'
import type { Todo } from '~~/shared/types/todo'

const { loggedIn, user } = useUserSession()
const { toast } = useToast()

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const stats = ref<AdminStats | null>(null)
const recentMessages = ref<Message[]>([])
const nextTodo = ref<Todo | null>(null)
const isLoadingMessages = ref(false)
const isLoadingNextTodo = ref(false)
const isRefreshing = ref(false)
const fetchAdmin = $fetch as (url: string) => Promise<any>

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

const firstName = computed(() => user.value?.name?.split(' ')[0] || 'Artist')
const greetingTime = computed(() => {
  const hours = new Date().getHours()

  if (hours < 12) return 'morning'
  if (hours < 18) return 'afternoon'
  return 'evening'
})

const publicCollectionsRatio = computed(() => {
  const total = stats.value?.collections.total ?? 0
  if (!total) return 0
  return Math.round(((stats.value?.collections.public ?? 0) / total) * 100)
})

const contentActivityChange = computed(() => {
  const monthlyAverageWeek = (contentActivity.value.last_30_days || 0) / 4.285
  if (!monthlyAverageWeek) return 0

  return Math.round(((contentActivity.value.last_7_days - monthlyAverageWeek) / monthlyAverageWeek) * 100)
})

const messageFreshness = computed(() => stats.value?.messages.newToday ?? 0)

const contentLastWeekWidth = computed(() => {
  const max = Math.max(contentActivity.value.total, contentActivity.value.last_30_days, 1)
  return Math.min(100, Math.round((contentActivity.value.last_7_days / max) * 100))
})

const contentLastMonthWidth = computed(() => {
  const max = Math.max(contentActivity.value.total, contentActivity.value.last_30_days, 1)
  return Math.min(100, Math.round((contentActivity.value.last_30_days / max) * 100))
})

const cadenceInsight = computed(() => {
  if (!contentActivity.value.last_30_days) {
    return 'No uploads detected over the last month yet.'
  }

  if (contentActivityChange.value > 10) {
    return 'Upload rhythm is accelerating compared to the monthly baseline.'
  }

  if (contentActivityChange.value < -10) {
    return 'Upload rhythm is slowing down. The gallery may need fresh work soon.'
  }

  return 'Upload rhythm is stable and aligned with the monthly baseline.'
})

const contentSparkline = computed(() => [
  Math.max(contentActivity.value.last_30_days - contentActivity.value.last_7_days, 1),
  Math.max(Math.round(contentActivity.value.last_30_days / 2), 1),
  Math.max(contentActivity.value.last_7_days, 1),
  Math.max(Math.round(contentActivity.value.last_30_days * 0.8), 1)
])

const collectionSparkline = computed(() => [
  Math.max(stats.value?.collections.private ?? 0, 1),
  Math.max(stats.value?.collections.public ?? 0, 1),
  Math.max(stats.value?.collections.total ?? 0, 1)
])

const messageSparkline = computed(() => [
  Math.max(stats.value?.messages.newToday ?? 0, 1),
  Math.max(stats.value?.messages.unread ?? 0, 1),
  Math.max(stats.value?.messages.total ?? 0, 1)
])

const userSparkline = computed(() => [
  Math.max(userGrowth.value.last_month, 1),
  Math.max(userGrowth.value.this_month, 1),
  Math.max(userGrowth.value.total, 1)
])

const quickActions = [
  {
    to: '/admin/images',
    label: 'Images',
    description: 'Upload, edit and curate illustrations.',
    icon: 'i-ph-image-square',
    iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
  },
  {
    to: '/admin/collections',
    label: 'Collections',
    description: 'Shape public and private series.',
    icon: 'i-ph-folder-open',
    iconClass: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400'
  },
  {
    to: '/admin/messages',
    label: 'Messages',
    description: 'Answer new contact requests quickly.',
    icon: 'i-ph-envelope-open',
    iconClass: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
  },
  {
    to: '/admin/todos',
    label: 'Todos',
    description: 'Track the next production tasks.',
    icon: 'i-ph-check-square-offset',
    iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
  },
  {
    to: '/admin/social',
    label: 'Social',
    description: 'Run and curate the social autopost queue.',
    icon: 'i-ph-share-network',
    iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
  }
]

const formatCompact = (value: number) => {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatRelativeDate = (dateString: string) => {
  const diffInMinutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)

  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 48) return 'yesterday'

  return formatDate(dateString)
}

const getInitials = (email: string) => {
  const localPart = email.split('@')[0]
  if (!localPart) return '??'

  const segments = localPart.split(/[._-]/).filter(Boolean)
  if (segments.length >= 2) {
    return `${segments[0]?.[0] || ''}${segments[1]?.[0] || ''}`.toUpperCase()
  }

  return localPart.slice(0, 2).toUpperCase()
}

const getStatusLabel = (status: Todo['status']) => {
  const labels: Record<Todo['status'], string> = {
    pending: 'Pending',
    in_progress: 'In progress',
    completed: 'Completed'
  }

  return labels[status]
}

const priorityBadgeClass = (priority: Todo['priority']) => {
  if (priority === 'high') return 'admin-badge-rose'
  if (priority === 'medium') return 'admin-badge-amber'
  return 'admin-badge-cyan'
}

const fetchStats = async () => {
  const endpoint: string = '/api/admin/stats'
  const response = await fetchAdmin(endpoint) as { success?: boolean, data?: AdminStats }
  if (response.success && response.data) {
    stats.value = response.data
  }
}

const fetchRecentMessages = async () => {
  isLoadingMessages.value = true

  try {
    const endpoint: string = '/api/admin/messages?limit=3'
    const response = await fetchAdmin(endpoint) as { success?: boolean, data?: { messages?: Message[] } }
    if (response.success) {
      recentMessages.value = response.data?.messages ?? []
    }
  } finally {
    isLoadingMessages.value = false
  }
}

const fetchNextTodo = async () => {
  isLoadingNextTodo.value = true

  try {
    const endpoint: string = '/api/admin/todos/next'
    const response = await fetchAdmin(endpoint) as { success?: boolean, data?: Todo | null }
    if (response.success) {
      nextTodo.value = response.data ?? null
    }
  } finally {
    isLoadingNextTodo.value = false
  }
}

const fetchUserGrowth = async () => {
  const endpoint: string = '/api/admin/analytics/user-growth'
  const response = await fetchAdmin(endpoint) as {
    success?: boolean
    data?: typeof userGrowth.value
  }

  if (response.success && response.data) {
    userGrowth.value = response.data
  }
}

const fetchContentActivity = async () => {
  const endpoint: string = '/api/admin/analytics/content-activity'
  const response = await fetchAdmin(endpoint) as {
    success?: boolean
    data?: typeof contentActivity.value
  }

  if (response.success && response.data) {
    contentActivity.value = response.data
  }
}

const reloadDashboard = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return

  isRefreshing.value = true

  try {
    await Promise.all([
      fetchStats(),
      fetchRecentMessages(),
      fetchNextTodo(),
      fetchUserGrowth(),
      fetchContentActivity()
    ])
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error)
    toast({
      title: 'Error',
      description: 'Failed to refresh the dashboard.',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isRefreshing.value = false
  }
}

onMounted(() => {
  reloadDashboard()
})

watch([loggedIn, () => user.value?.role], ([newLoggedIn, newRole]) => {
  if (newLoggedIn && newRole === 'admin') {
    reloadDashboard()
  }
})
</script>
