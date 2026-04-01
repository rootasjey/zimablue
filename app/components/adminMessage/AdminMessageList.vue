<template>
  <div class="admin-card overflow-hidden">
    <div class="border-b border-stone-200 px-5 py-4 dark:border-zinc-800">
      <p class="text-xs font-medium uppercase tracking-[0.22em] text-stone-400 dark:text-zinc-500">Inbox list</p>
    </div>

    <div v-if="isLoading" class="space-y-3 p-5">
      <div v-for="n in 5" :key="n" class="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-zinc-800"></div>
    </div>

    <div v-else-if="messages.length === 0" class="p-10 text-center">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-stone-100 text-stone-400 dark:bg-zinc-800 dark:text-zinc-500">
        <span class="i-ph-envelope-simple text-2xl"></span>
      </div>
      <h3 class="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">No messages found</h3>
      <p class="mt-2 text-sm text-stone-500 dark:text-zinc-400">Try another search or filter.</p>
    </div>

    <div v-else class="max-h-[720px] space-y-3 overflow-y-auto p-4">
      <button
        v-for="message in messages"
        :key="message.id"
        class="group relative w-full rounded-2xl border p-4 text-left transition-all duration-200"
        :class="selectedMessages[message.id] || message.id === activeMessageId
          ? 'border-amber-300 bg-amber-50 shadow-sm dark:border-amber-900/80 dark:bg-amber-950/20'
          : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900'"
        @click="multiSelectActive ? $emit('select-message', message.id) : $emit('view-message', message)"
      >
        <div class="flex items-start gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {{ getInitials(message.sender_email) }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100" :class="!message.read ? 'font-semibold' : ''">
                  {{ message.subject }}
                </p>
                <p class="mt-1 truncate text-xs text-stone-500 dark:text-zinc-400">{{ message.sender_email }}</p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span v-if="!message.read" class="admin-badge-amber">Unread</span>
                <span class="text-[11px] text-stone-400 dark:text-zinc-500">{{ formatDate(message.created_at) }}</span>
              </div>
            </div>

            <p class="mt-3 line-clamp-2 text-sm leading-6 text-stone-600 dark:text-zinc-400">
              {{ truncateMessage(message.message) }}
            </p>
          </div>
        </div>

        <div v-if="multiSelectActive" class="absolute right-4 top-4">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-full border text-xs transition-colors"
            :class="selectedMessages[message.id]
              ? 'border-cyan-500 bg-cyan-500 text-white'
              : 'border-stone-300 text-stone-400 dark:border-zinc-700 dark:text-zinc-500'"
          >
            <span :class="selectedMessages[message.id] ? 'i-ph-check-bold' : 'i-ph-check'"></span>
          </span>
        </div>
      </button>
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

const truncateMessage = (message: string, maxLength: number = 150): string => {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}

const getInitials = (email: string): string => {
  const localPart = email.split('@')[0] || '??'
  const segments = localPart.split(/[._-]/).filter(Boolean)

  if (segments.length >= 2) {
    return `${segments[0]?.[0] || ''}${segments[1]?.[0] || ''}`.toUpperCase()
  }

  return localPart.slice(0, 2).toUpperCase()
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