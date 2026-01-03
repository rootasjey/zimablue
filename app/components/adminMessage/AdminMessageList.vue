<template>
  <div class="bg-[#D1E0E9] dark:bg-gray-800 rounded-3 overflow-hidden">
    <!-- List has no internal header; selection controls live in AdminMessageHeader -->

    <!-- Loading State -->
    <div v-if="isLoading" class="p-8 text-center">
      <div class="animate-spin i-ph-spinner text-2xl text-gray-400 mb-2"></div>
      <p class="text-gray-600 dark:text-gray-400">Loading messages...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="messages.length === 0" class="p-8 text-center">
      <div class="i-ph-envelope text-4xl text-gray-400 mb-4"></div>
      <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No messages found</h3>
      <p class="text-gray-600 dark:text-gray-400">There are no messages to display.</p>
    </div>

    <!-- Messages List -->
    <div v-else class="space-y-4 px-4 py-2 my-2">
      <div v-for="message in messages" :key="message.id"
        class="relative group rounded-xl border b-transparent transition-all transition-duration-300 cursor-pointer flex items-stretch"
        :class="{
          'border-blue-500 border-1 ring-1 ring-blue-100 dark:ring-blue-900 bg-blue-50 dark:bg-blue-500/5': selectedMessages[message.id] || message.id === activeMessageId,
          'bg-white/70 dark:bg-gray-900': !(selectedMessages[message.id] || message.id === activeMessageId)
        }" @click="multiSelectActive ? $emit('select-message', message.id) : $emit('view-message', message)">
        <!-- Selection Check Overlay (selected) -->
        <div v-if="multiSelectActive && selectedMessages[message.id]"
          class="absolute right-10 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-gray-200 shadow-md pointer-events-none"
          aria-hidden="true">
          <span class="i-ph-check-bold text-xs"></span>
        </div>

        <!-- Faint Check Overlay (hint when not selected) -->
        <div v-else-if="multiSelectActive && !selectedMessages[message.id]"
          class="absolute right-10 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-gray-500/10 text-gray-700/50 border border-gray-400/30 pointer-events-none opacity-0 group-hover:opacity-70 transition-opacity duration-150"
          aria-hidden="true">
          <span class="i-ph-check text-xs"></span>
        </div>

        <!-- Message Content -->
        <div class="flex-1 min-w-0 py-4 pr-4 pl-2">
          <div class="px-2 flex flex-col">
            <div class="flex justify-between items-center gap-2">
              <h3 class="text-size-3 font-semibold text-gray-900 dark:text-gray-200 truncate"
                :class="{ 'font-bold': !message.read }">
                {{ message.subject }}
              </h3>
              <span v-if="!message.read" class="ml-2 px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                Unread
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-size-3 font-medium text-gray-700 dark:text-gray-200 truncate">{{ message.sender_email }}</span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
              {{ truncateMessage(message.message) }}
            </p>
            <div class="flex justify-end text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{{ formatDate(message.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Message {
  id: number
  sender_email: string
  subject: string
  message: string
  read: boolean
  created_at: string
  updated_at: string
}

interface Props {
  messages: Message[]
  selectedMessages: Record<number, boolean>
  isLoading: boolean
  multiSelectActive: boolean
  activeMessageId?: number
}

interface Emits {
  (e: 'select-message', messageId: number): void
  (e: 'view-message', message: Message): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Utility functions
const truncateMessage = (message: string, maxLength: number = 150): string => {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`
  }

  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  if (diffInHours < 24 * 7) {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return date.toLocaleDateString('fr-FR', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>