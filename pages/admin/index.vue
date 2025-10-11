<template>
  <div>
    <!-- Main Content -->
    <main>
      <!-- Access Control -->
      <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
        <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
        <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
        <UButton to="/user" class="mt-4">Go to Profile</UButton>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="space-y-6">
        <!-- Greeting/Header -->
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl sm:text-3xl font-700 text-gray-900 dark:text-white">Good {{ greetingTime }}, {{ firstName }}!</h1>
          </div>

          <!-- Quick profile / actions -->
          <div class="hidden sm:flex items-center gap-3">
            <button class="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition">
              <span class="i-ph-calendar text-gray-700 dark:text-gray-300 text-lg"></span>
            </button>
            <button class="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition">
              <span class="i-ph-bell text-gray-700 dark:text-gray-300 text-lg"></span>
            </button>
            <ClientOnly>
              <UDropdownMenu :items="userMenuItems" dropdown-menu="link-gray"
                :_dropdown-menu-content="{ class: 'w-48', align: 'end' }">
                <template #trigger>
                  <button
                    class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center hover:opacity-90 transition">
                    <span class="i-ph-user text-white text-lg"></span>
                  </button>
                </template>
              </UDropdownMenu>
              <template #fallback>
                <button
                  class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center opacity-50">
                  <span class="i-ph-user text-white text-lg"></span>
                </button>
              </template>
            </ClientOnly>
          </div>
        </div>

        <div class="flex gap-12">
          <div class="flex-1 space-y-6 max-w-70%">
            <!-- Top Stats Row -->
            <div class="flex gap-6 overflow-x-auto">
              <!-- Bank Balance Card -->
              <div class="w-48 shrink-0 rounded-[28px] p-6 pt-2.5 pb-12 bg-[#D1E0E9] dark:bg-gray-800 relative">
                <button
                  class="absolute right-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/70 transition">
                  <span class="i-ph-dots-three-vertical-bold text-gray-700 dark:text-gray-300"></span>
                </button>
                <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <span class="i-ph-wallet text-gray-900 dark:text-gray-300 text-2xl"></span>
                </div>
                <div class="text-3xl font-800 text-gray-900 dark:text-white mb-1">$143,624</div>
                <div class="text-sm text-gray-600">Your bank balance</div>
              </div>

              <!-- Uncategorized Transactions -->
              <div class="w-48 shrink-0 rounded-[28px] p-6 pt-2.5 pb-12 bg-[#D1E0E9] dark:bg-gray-800 relative">
                <button
                  class="absolute right-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/70 transition">
                  <span class="i-ph-dots-three-vertical-bold text-gray-700 dark:text-gray-300"></span>
                </button>
                <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <span class="i-ph-clock text-gray-900 dark:text-gray-300 text-2xl"></span>
                </div>
                <div class="text-3xl font-800 text-gray-900 dark:text-white mb-1">12</div>
                <div class="text-sm text-gray-600 dark:text-gray-300">Uncategorized transactions</div>
              </div>

              <!-- Employees Working Today -->
              <div class="w-48 shrink-0 rounded-[28px] p-6 pt-2.5 pb-12 bg-[#D1E0E9] dark:bg-gray-800 relative">
                <button
                  class="absolute right-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/70 transition">
                  <span class="i-ph-dots-three-vertical-bold text-gray-700 dark:text-gray-300"></span>
                </button>
                <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <span class="i-ph-users text-gray-900 dark:text-gray-300 text-2xl"></span>
                </div>
                <div class="text-3xl font-800 text-gray-900 dark:text-white mb-1">7</div>
                <div class="text-sm text-gray-600 dark:text-gray-300">Employees working today</div>
              </div>

              <!-- Card Spending -->
              <div class="w-48 shrink-0 rounded-[28px] p-6 pt-2.5 pb-12 bg-[#D1E0E9] dark:bg-gray-800 relative">
                <button
                  class="absolute right-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/70 transition">
                  <span class="i-ph-dots-three-vertical-bold text-gray-700 dark:text-gray-300"></span>
                </button>
                <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <span class="i-ph-credit-card text-gray-900 dark:text-gray-300 text-2xl"></span>
                </div>
                <div class="text-3xl font-800 text-gray-900 dark:text-white mb-1">$3,287.49</div>
                <div class="text-sm text-gray-600 dark:text-gray-300">This week's card spending</div>
              </div>
            </div>

            <!-- Middle Section: Stats + Chart -->
            <div class="flex gap-4">
              <!-- Left: Stacked Cards -->
              <div class="space-y-4">
                <!-- User Growth -->
                <div class="w-64 rounded-[28px] p-6 bg-[#D1E0E9] dark:bg-gray-800">
                  <div class="text-size-4 font-800 mb-2">New users this month</div>
                  <div v-if="isLoadingUserGrowth" class="h-16 bg-white/50 rounded-xl animate-pulse"></div>
                  <div v-else class="flex items-center gap-3">
                    <div class="text-5xl font-800 text-gray-900 dark:text-white">{{ userGrowth.this_month }}</div>
                    <span
                      class="px-2 py-1 rounded-full text-xs font-700"
                      :class="userGrowth.percentage_change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
                    >
                      {{ userGrowth.percentage_change >= 0 ? '+' : '' }} {{ userGrowth.percentage_change }}%
                    </span>
                  </div>
                </div>

                <!-- Content Activity -->
                <div class="w-64 rounded-[28px] p-6 bg-[#D1E0E9] dark:bg-gray-800">
                  <div class="text-size-4 font-800 mb-2">Images (7 days)</div>
                  <div v-if="isLoadingContentActivity" class="h-16 bg-white/50 rounded-xl animate-pulse"></div>
                  <div v-else class="flex items-center gap-3">
                    <div class="text-5xl font-800 text-gray-900 dark:text-white">{{ contentActivity.last_7_days }}</div>
                    <span class="px-2 py-1 rounded-full text-xs font-700 bg-blue-100 text-blue-700">
                      {{ contentActivity.last_30_days }} / 30d
                    </span>
                  </div>
                </div>
              </div>

              <!-- Right: Revenue Chart -->
              <div class="flex-1 rounded-[28px] p-6 bg-[#D1E0E9] dark:bg-gray-800">
                <div class="flex items-center justify-between mb-4">
                  <div class="text-lg font-700 text-gray-900 dark:text-white">Revenue</div>
                  <div class="text-sm text-gray-600 dark:text-gray-300">Last 7 days VS prior week</div>
                </div>
                <!-- Placeholder for chart -->
                <div class="h-48 flex items-center justify-center rounded-2xl">
                  <div class="text-center text-gray-500">
                    <span class="i-ph-chart-line text-4xl mb-2"></span>
                    <p class="text-sm">Chart placeholder</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Messages -->
            <div class="rounded-[28px] p-6 bg-[#D1E0E9] dark:bg-gray-800">
              <div class="flex items-center justify-between mb-4">
                <div class="text-lg font-700 text-gray-900 dark:text-white">Recent messages</div>
                <UButton to="/admin/messages" btn="light:soft-blue dark:soft-blue" rounded="6" size="sm">View all</UButton>
              </div>

              <div v-if="isLoadingMessages" class="space-y-3">
                <div v-for="n in 4" :key="n" class="h-16 bg-white/50 rounded-xl animate-pulse"></div>
              </div>

              <div v-else-if="recentMessages.length === 0" class="text-center py-8 text-gray-500">
                No recent messages
              </div>

              <div v-else class="space-y-3">
                <NuxtLink
                  v-for="message in recentMessages"
                  :key="message.id"
                  :to="`/admin/messages`"
                  class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition cursor-pointer"
                >
                  <div class="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-600">
                    {{ getInitials(message.sender_email) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-600 text-gray-900 dark:text-white flex items-center gap-2">
                      {{ message.sender_email }}
                      <span v-if="!message.read" class="w-2 h-2 rounded-full bg-blue-500"></span>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-300 truncate">{{ message.subject }}</div>
                  </div>
                  <div class="text-sm text-gray-500">{{ formatMessageDate(message.created_at) }}</div>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Right Column: Stacked Cards -->
          <div class="space-y-4">
            <!-- Next Project (dark card) -->
            <div v-if="nextTodo" class="rounded-[28px] bg-black text-white p-6">
              <div class="flex items-center justify-between mb-2">
                <div class="text-lg font-700">Next Project</div>
                <span
                  class="px-2 py-1 rounded-full text-xs font-700"
                  :class="nextTodo.priority === 'high' ? 'bg-red-500/20 text-red-300' : nextTodo.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'"
                >
                  {{ nextTodo.priority }}
                </span>
              </div>
              <div class="text-xl font-600 mb-2">{{ nextTodo.title }}</div>
              <div class="text-sm text-gray-300 mb-4">Due: {{ formatDate(nextTodo.due_date) }}</div>
              <div class="flex items-center gap-2 text-sm text-gray-200 mb-4">
                <span class="i-ph-clock"></span>
                <span>{{ getStatusLabel(nextTodo.status) }}</span>
              </div>
              <UButton to="/admin/todos" size="sm" class="w-full justify-center" btn="soft-white">
                View all tasks
              </UButton>
            </div>

            <!-- No upcoming tasks -->
            <div v-else-if="!isLoadingNextTodo" class="rounded-[28px] bg-black text-white p-6">
              <div class="text-lg font-700 mb-2">Next Project</div>
              <div class="text-sm text-gray-300 mb-4">No upcoming tasks</div>
              <UButton to="/admin/todos" size="sm" class="w-full justify-center" btn="soft-white">
                Create a task
              </UButton>
            </div>

            <!-- Loading state -->
            <div v-else class="rounded-[28px] bg-black text-white p-6 h-48 animate-pulse"></div>

            <!-- To-Do List -->
            <div class="rounded-[28px] bg-[#D1E0E9] p-6">
              <div class="text-lg font-700 text-gray-900 mb-4">Your to-Do list</div>
              <div class="space-y-3">
                <div v-for="item in todoItems" :key="item.title" class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="i-ph-check text-white text-sm"></span>
                  </div>
                  <div class="flex-1">
                    <div class="font-600 text-gray-900">{{ item.title }}</div>
                    <div class="text-sm text-gray-600">{{ item.time }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Board Meeting (dark card) -->
            <div class="rounded-[28px] bg-black text-white p-6">
              <div class="flex items-center justify-between mb-2">
                <div class="text-lg font-700">Board meeting</div>
                <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
              </div>
              <div class="text-sm text-gray-200 mb-2">Feb 22 at 6:00 PM</div>
              <p class="text-sm text-gray-300">You have been invited to attend a meeting of the Board Directors.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import type { AdminStats } from '~/types/admin'
import type { Message } from '~/types/message'
import type { Todo } from '~/types/todo'

const { loggedIn, user } = useUserSession()
const { toast } = useToast()

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const stats = ref<AdminStats | null>(null)
const isLoading = ref(false)
const isLoadingMessages = ref(false)
const isLoadingNextTodo = ref(false)
const isLoadingUserGrowth = ref(false)
const isLoadingContentActivity = ref(false)
const recentMessages = ref<Message[]>([])
const nextTodo = ref<Todo | null>(null)

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

// Greeting helpers
const firstName = computed(() => user.value?.name?.split(' ')[0] || 'James')
const greetingTime = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
})

// Mock data for to-do list (for the "Your to-Do list" card)
const todoItems = ref([
  { title: 'Run payroll', time: 'Mar 4 at 6:00 pm' },
  { title: 'Review time off request', time: 'Mar 7 at 6:00 pm' },
  { title: 'Sign board resolution', time: 'Mar 12 at 6:00 pm' },
  { title: 'Finish onboarding Tony', time: 'Mar 15 at 6:00 pm' },
])

// User menu items
const userMenuItems = [
  { label: 'Profile', onClick: () => navigateTo('/user') },
  { label: 'Settings', onClick: () => navigateTo('/admin/settings') },
  { label: 'Logout', onClick: () => navigateTo('/logout') },
]

// Helper functions
const getInitials = (email: string) => {
  const parts = email.split('@')[0].split('.')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return email.substring(0, 2).toUpperCase()
}

const formatMessageDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) {
    const m = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    return m < 1 ? 'Just now' : `${m}m ago`
  }
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 48) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed'
  }
  return labels[status] || status
}

// Simple chart data
const chart = reactive({ currPoints: '', prevPoints: '' })
const buildChart = () => {
  // Generate tiny demo data based on stats counts, normalized to 0..100
  const seed = (stats.value?.images.total ?? 50) + (stats.value?.users.total ?? 50)
  const curr = Array.from({ length: 7 }, (_, i) => ((Math.sin((i + seed % 10) / 2) + 1) * 40 + 10))
  const prev = curr.map((v, i) => Math.max(5, v - 8 + ((i % 2) ? 6 : -4)))
  const toPoints = (arr: number[]) => arr.map((v, i) => `${(i) * (300/6)},${100 - v}`).join(' ')
  chart.currPoints = toPoints(curr)
  chart.prevPoints = toPoints(prev)
}

const fetchStats = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return
  
  isLoading.value = true
  try {
    const response = await $fetch('/api/admin/stats')
    if (response.success) {
      stats.value = response.data
      buildChart()
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

const fetchRecentMessages = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return
  isLoadingMessages.value = true
  try {
    const res = await $fetch('/api/admin/messages?limit=4')
    if (res?.success) {
      recentMessages.value = res.data.messages
    }
  } catch (e) {
    console.warn('Failed to load recent messages', e)
  } finally {
    isLoadingMessages.value = false
  }
}

const fetchNextTodo = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return
  isLoadingNextTodo.value = true
  try {
    const res = await $fetch('/api/admin/todos/next') as any
    if (res?.success) {
      nextTodo.value = res.data
    }
  } catch (e) {
    console.warn('Failed to load next todo', e)
  } finally {
    isLoadingNextTodo.value = false
  }
}

const fetchUserGrowth = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return
  isLoadingUserGrowth.value = true
  try {
    const res = await $fetch('/api/admin/analytics/user-growth') as any
    if (res?.success) {
      userGrowth.value = res.data
    }
  } catch (e) {
    console.warn('Failed to load user growth', e)
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
    console.warn('Failed to load content activity', e)
  } finally {
    isLoadingContentActivity.value = false
  }
}

// Helper function for formatting dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(() => {
  if (loggedIn.value && user.value?.role === 'admin') {
    fetchStats()
    fetchRecentMessages()
    fetchNextTodo()
    fetchUserGrowth()
    fetchContentActivity()
  }
})

watch([loggedIn, () => user.value?.role], ([newLoggedIn, newRole]) => {
  if (newLoggedIn && newRole === 'admin') {
    fetchStats()
    fetchRecentMessages()
    fetchNextTodo()
    fetchUserGrowth()
    fetchContentActivity()
  }
})
</script>

<style scoped>
/* Tiny motion transitions */
.fade-slide-enter-active,
.fade-slide-leave-active { transition: all .3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(6px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(6px); }

/* Chart line draw animation */
.chart-line {
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
  animation: line-draw 900ms ease forwards;
}
@keyframes line-draw {
  to { stroke-dashoffset: 0; }
}

/* Thin horizontal scrollbar on KPI row (fallback) */
.scrollbar-thin { scrollbar-width: thin; }
.scrollbar-thin::-webkit-scrollbar { height: 8px; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(0,0,0,.15); border-radius: 9999px; }
</style>
