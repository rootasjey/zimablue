<template>
  <NDialog
    :open="isOpen"
    @update:open="$emit('update:isOpen', $event)"
    :show-close="false"
    :una="{
      dialogContent: maximized ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-2xl'
    }"
  >
    <!-- Header: title + custom buttons -->
    <div class="mb-3 flex items-start justify-between gap-3">
      <div v-if="title" class="min-w-0">
        <h3 class="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{{ title }}</h3>
        <p v-if="description" class="mt-0.5 line-clamp-2 text-xs text-stone-400 dark:text-zinc-500">{{ description }}</p>
      </div>
      <div v-else></div>

      <div class="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
          :title="maximized ? 'Shrink' : 'Maximize'"
          @click.stop="toggleMaximize"
        >
          <span :class="maximized ? 'i-ph-arrows-in' : 'i-ph-arrows-out'" class="text-sm"></span>
        </button>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
          title="Close"
          @click.stop="close"
        >
          <span class="i-ph-x text-sm"></span>
        </button>
      </div>
    </div>

    <!-- Image -->
    <div class="flex items-center justify-center overflow-hidden">
      <NuxtImg
        v-if="src"
        :src="src"
        provider="hubblob"
        :alt="title || 'Image preview'"
        class="max-h-[70vh] w-full rounded-lg object-contain cursor-pointer"
        @click="toggleMaximize"
      />
      <div v-else class="flex h-48 w-full items-center justify-center rounded-lg bg-stone-100 dark:bg-zinc-800">
        <span class="text-3xl text-stone-300 i-ph-image dark:text-zinc-600"></span>
      </div>
    </div>
  </NDialog>
</template>

<script lang="ts" setup>
interface Props {
  isOpen: boolean
  src?: string | null
  title?: string | null
  description?: string | null
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const maximized = ref(false)

const toggleMaximize = () => {
  maximized.value = !maximized.value
}

const close = () => {
  emit('update:isOpen', false)
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) maximized.value = false
  }
)

function handleKeydown(e: KeyboardEvent) {
  if (!props.isOpen) return
  if (e.key === 'm' || e.key === 'M') {
    e.preventDefault()
    toggleMaximize()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>
