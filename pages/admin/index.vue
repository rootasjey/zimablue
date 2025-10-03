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
            <h1 class="text-2xl sm:text-3xl font-700 text-gray-900">Good {{ greetingTime }}, {{ firstName }}!</h1>
          </div>

          <!-- Quick profile / actions -->
          <div class="hidden sm:flex items-center gap-3">
            <button class="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 transition">
              <span class="i-ph-calendar text-gray-700 text-lg"></span>
            </button>
            <button class="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 transition">
              <span class="i-ph-bell text-gray-700 text-lg"></span>
            </button>
            <UDropdownMenu :items="userMenuItems" dropdown-menu="link-gray"
              :_dropdown-menu-content="{ class: 'w-48', align: 'end' }">
              <template #trigger>
                <button
                  class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center hover:opacity-90 transition">
                  <span class="i-ph-user text-white text-lg"></span>
                </button>
              </template>
            </UDropdownMenu>
          </div>
        </div>

        <div class="flex gap-12">
          <div class="flex-1 space-y-6">
            <!-- Top Stats Row -->
            <div class="flex gap-6 overflow-x-auto">
              <!-- Bank Balance Card -->
              <div class="w-48 rounded-[28px] p-6 py-10 bg-[#D1E0E9] relative">
                <button
                  class="absolute right-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/70 transition">
                  <span class="i-ph-dots-three-vertical-bold text-gray-700"></span>
                </button>
                <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <span class="i-ph-wallet text-gray-900 text-2xl"></span>
                </div>
                <div class="text-3xl font-800 text-gray-900 mb-1">$143,624</div>
                <div class="text-sm text-gray-600">Your bank balance</div>
              </div>

              <!-- Uncategorized Transactions -->
              <div class="w-48 rounded-[28px] p-6 py-10 bg-[#D1E0E9] relative">
                <button
                  class="absolute right-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/70 transition">
                  <span class="i-ph-dots-three-vertical-bold text-gray-700"></span>
                </button>
                <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <span class="i-ph-clock text-gray-900 text-2xl"></span>
                </div>
                <div class="text-3xl font-800 text-gray-900 mb-1">12</div>
                <div class="text-sm text-gray-600">Uncategorized transactions</div>
              </div>

              <!-- Employees Working Today -->
              <div class="w-48 rounded-[28px] p-6 py-10 bg-[#D1E0E9] relative">
                <button
                  class="absolute right-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/70 transition">
                  <span class="i-ph-dots-three-vertical-bold text-gray-700"></span>
                </button>
                <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <span class="i-ph-users text-gray-900 text-2xl"></span>
                </div>
                <div class="text-3xl font-800 text-gray-900 mb-1">7</div>
                <div class="text-sm text-gray-600">Employees working today</div>
              </div>

              <!-- Card Spending -->
              <div class="w-48 rounded-[28px] p-6 py-10 bg-[#D1E0E9] relative">
                <button
                  class="absolute right-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/70 transition">
                  <span class="i-ph-dots-three-vertical-bold text-gray-700"></span>
                </button>
                <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <span class="i-ph-credit-card text-gray-900 text-2xl"></span>
                </div>
                <div class="text-3xl font-800 text-gray-900 mb-1">$3,287.49</div>
                <div class="text-sm text-gray-600">This week's card spending</div>
              </div>
            </div>

            <!-- Middle Section: Stats + Chart -->
            <div class="flex gap-4">
              <!-- Left: Stacked Cards -->
              <div class="space-y-4">
                <!-- New Clients -->
                <div class="w-64 rounded-[28px] p-6 bg-[#D1E0E9]">
                  <div class="text-size-4 font-800 mb-2">New clients</div>
                  <div class="flex items-center gap-3">
                    <div class="text-5xl font-800 text-gray-900">54</div>
                    <span class="px-2 py-1 rounded-full text-xs font-700 bg-emerald-100 text-emerald-700">+ 18.7%</span>
                  </div>
                </div>

                <!-- Invoices Overdue -->
                <div class="w-64 rounded-[28px] p-6 bg-[#D1E0E9]">
                  <div class="text-size-4 font-800 mb-2">Invoices overdue</div>
                  <div class="flex items-center gap-3">
                    <div class="text-5xl font-800 text-gray-900">6</div>
                    <span class="px-2 py-1 rounded-full text-xs font-700 bg-red-100 text-red-700">+ 2.7%</span>
                  </div>
                </div>
              </div>

              <!-- Right: Revenue Chart -->
              <div class="flex-1 rounded-[28px] p-6 bg-[#D1E0E9]">
                <div class="flex items-center justify-between mb-4">
                  <div class="text-lg font-700 text-gray-900">Revenue</div>
                  <div class="text-sm text-gray-600">Last 7 days VS prior week</div>
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

            <!-- Recent Emails -->
            <div class="rounded-[28px] p-6 bg-[#D1E0E9]">
              <div class="text-lg font-700 text-gray-900 mb-4">Recent emails</div>
              <div class="space-y-3">
                <div v-for="email in recentEmails" :key="email.id"
                  class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition cursor-pointer">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-600"
                    :style="{ backgroundColor: email.color }">
                    {{ email.initials }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-600 text-gray-900">{{ email.name }}</div>
                    <div class="text-sm text-gray-600 truncate">{{ email.subject }}</div>
                  </div>
                  <div class="text-sm text-gray-500">{{ email.time }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Stacked Cards -->
          <div class="space-y-4">
            <!-- Formation Status (dark card) -->
            <div class="rounded-[28px] bg-black text-white p-6">
              <div class="text-lg font-700 mb-1">Formation status</div>
              <div class="text-sm text-gray-300 mb-4">In progress</div>
              <div class="h-2 rounded-full bg-white/20 overflow-hidden mb-3">
                <div class="h-full bg-white/90 rounded-full" style="width: 62%"></div>
              </div>
              <div class="text-sm text-gray-200 mb-4">Estimated processing 4–5 business days</div>
              <button
                class="w-full px-4 py-2 rounded-xl bg-white text-black font-600 text-sm hover:bg-gray-100 transition">
                View status
              </button>
            </div>

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

const { loggedIn, user } = useUserSession()
const { toast } = useToast()

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const stats = ref<AdminStats | null>(null)
const isLoading = ref(false)
const isLoadingMessages = ref(false)
const recentMessages = ref<Message[]>([])

// Greeting helpers
const firstName = computed(() => user.value?.name?.split(' ')[0] || 'James')
const greetingTime = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
})

// Mock data for recent emails
const recentEmails = ref([
  { id: 1, name: 'Hannah Morgan', initials: 'HM', subject: 'Meeting scheduled', time: '1:24 PM', color: '#EF4444' },
  { id: 2, name: 'Megan Clark', initials: 'MC', subject: 'Update on marketing campaign', time: '12:32 PM', color: '#10B981' },
  { id: 3, name: 'Brandon Williams', initials: 'BW', subject: 'Designly 2.0 is about to launch', time: 'Yesterday at 8:57 PM', color: '#F59E0B' },
  { id: 4, name: 'Reid Smith', initials: 'RS', subject: 'My friend Julie loves Dappr!', time: 'Yesterday at 8:49 PM', color: '#8B5CF6' },
])

// Mock data for to-do list
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

onMounted(() => {
  if (loggedIn.value && user.value?.role === 'admin') {
    fetchStats()
    fetchRecentMessages()
  }
})

watch([loggedIn, () => user.value?.role], ([newLoggedIn, newRole]) => {
  if (newLoggedIn && newRole === 'admin') {
    fetchStats()
    fetchRecentMessages()
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
