<template>
  <div v-if="message" class="admin-card min-h-[520px] p-5 sm:p-6">
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-4 border-b border-stone-200 pb-5 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full" :class="message.read ? 'bg-stone-300 dark:bg-zinc-600' : 'bg-amber-400'"></span>
            <span class="text-xs uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">
              {{ message.read ? 'Read' : 'Unread' }}
            </span>
          </div>
          <h3 class="mt-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">{{ message.subject }}</h3>
          <div class="mt-4 flex flex-wrap gap-3 text-xs text-stone-500 dark:text-zinc-400">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 dark:bg-zinc-800">
              <span class="i-ph-envelope-simple"></span>
              {{ message.sender_email }}
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 dark:bg-zinc-800">
              <span class="i-ph-clock"></span>
              {{ formatFullDate(message.created_at) }}
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 dark:bg-zinc-800">
              <span class="i-ph-hash"></span>
              #{{ message.id }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            class="inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-sm font-medium transition-colors"
            :class="message.read
              ? 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              : 'bg-amber-500 text-white hover:bg-amber-400'"
            @click="handleMarkRead(!message.read)"
          >
            <span :class="message.read ? 'i-ph-circle' : 'i-ph-check'"></span>
            {{ message.read ? 'Mark unread' : 'Mark read' }}
          </button>
          <button class="inline-flex h-10 items-center gap-2 rounded-2xl bg-rose-50 px-3 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60" @click="$emit('delete', message)">
            <span class="i-ph-trash"></span>
            Delete
          </button>
          <button class="inline-flex h-10 items-center gap-2 rounded-2xl bg-stone-100 px-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700" @click="$emit('close')">
            <span class="i-ph-x"></span>
            Close
          </button>
        </div>
      </div>

      <div class="rounded-[28px] border border-dashed border-stone-200 bg-stone-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
        <div class="prose prose-stone max-w-none whitespace-pre-wrap break-words text-[15px] leading-7 text-zinc-800 dark:prose-invert dark:text-zinc-200" v-html="formattedMessage"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Message } from '~~/shared/types/message'

const props = defineProps<{ message: Message }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'mark-read', messageId: number, read: boolean): void
  (e: 'delete', message: Message): void
}>()

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const formattedMessage = computed(() => {
  if (!props.message) return ''

  const escaped = escapeHtml(props.message.message)
  const linkedUrls = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="font-medium text-cyan-700 underline decoration-cyan-300 underline-offset-3 hover:text-cyan-800 dark:text-cyan-300 dark:decoration-cyan-700 dark:hover:text-cyan-200">$1</a>'
  )

  return linkedUrls.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '<a href="mailto:$1" class="font-medium text-cyan-700 underline decoration-cyan-300 underline-offset-3 hover:text-cyan-800 dark:text-cyan-300 dark:decoration-cyan-700 dark:hover:text-cyan-200">$1</a>'
  )
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
