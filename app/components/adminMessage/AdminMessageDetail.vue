<template>
  <NCard v-if="message" class="bg-white/70 dark:bg-gray-900" border="0" shadow="lg" rounded="xl">
    <!-- Header -->
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 rounded-full" :class="message.read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-blue-500'"
            :title="message.read ? 'Read' : 'Unread'"></div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-200">
            {{ message.subject }}
          </h3>
        </div>

        <div class="flex items-center gap-2">
          <NTooltip>
            <template #default>
              <NButton
                @click="handleMarkRead(!message.read)"
                :btn="message.read ? 'soft-blue' : 'solid-blue'"
                :label="message.read ? 'i-ph-circle' : 'i-ph-check'" size="xs" icon
              />
            </template>
            <template #content>
              <div class="px-3 py-1">{{ message.read ? 'Mark this message as unread' : 'Mark this message as read' }}</div>
            </template>
          </NTooltip>

          <NTooltip>
            <template #default>
              <NButton @click="$emit('delete', message)" btn="soft-pink" icon label="i-tabler-trash" size="xs" />
            </template>
            <template #content>
              <div class="px-3 py-1">Delete this message</div>
            </template>
          </NTooltip>

          <NTooltip>
            <template #default>
              <NButton size="xs" icon btn="soft-lime" label="i-tabler-x" aria-label="Close" @click="$emit('close')" />
            </template>
            <template #content>
              <div class="px-3 py-1">Close message detail view</div>
            </template>
          </NTooltip>
        </div>
      </div>
    </template>

    <!-- Message Content -->
    <div class="space-y-3">
      <!-- Compact Info Row -->
      <div class="flex flex-wrap gap-4 items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
        <span class="flex items-center gap-1">
          <span class="i-ph-envelope text-gray-400"></span>
          {{ message.sender_email }}
        </span>
        <span class="flex items-center gap-1">
          <span class="i-ph-clock text-gray-400"></span>
          {{ formatFullDate(message.created_at) }}
        </span>
        <span class="flex items-center gap-1">
          <span class="i-ph-hash text-gray-400"></span>
          #{{ message.id }}
        </span>
        <span class="flex items-center gap-1">
          <span class="i-ph-circle text-gray-400"></span>
          {{ message.read ? 'Read' : 'Unread' }}
        </span>
      </div>

      <!-- Message Body - visually emphasized -->
      <div>
        <div
          class="p-6 bg-white dark:bg-gray-900 rounded-xl border-1 b-dashed border-gray-400 dark:border-blue-900 max-h-[32rem] overflow-y-auto">
          <div class="text-lg font-medium text-gray-900 dark:text-gray-200 whitespace-pre-wrap leading-relaxed"
            style="word-break:break-word;" v-html="formattedMessage"></div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
    </template>
  </NCard>
</template>

<script lang="ts" setup>
import type { Message } from '~~/shared/types/message'

const props = defineProps<{ message: Message }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'mark-read', messageId: number, read: boolean): void
  (e: 'delete', message: Message): void
}>()

const formattedMessage = computed(() => {
  if (!props.message) return ''
  // Basic HTML escaping and formatting (kept simple)
  let formatted = props.message.message
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")

  const urlRegex = /(https?:\/\/[^\s]+)/g
  formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>')

  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  formatted = formatted.replace(emailRegex, '<a href="mailto:$1" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>')

  return formatted
})

const formatFullDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const handleMarkRead = (read: boolean) => {
  emit('mark-read', props.message.id, read)
}
</script>

<style scoped>
/* reuse scrollbar styles from modal */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background-color: rgb(243 244 246); border-radius: 0.25rem;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgb(209 213 219);
  border-radius: 0.25rem;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgb(156 163 175);
}
</style>
