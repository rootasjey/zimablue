<template>
  <NDialog :open="isOpen" @update:open="$emit('update:isOpen', $event)" :_dialog="{ class: 'w-[calc(100vw-1rem)] sm:max-w-3xl' }">
    <template #content>
      <div v-if="image" class="p-6">
        <div class="flex flex-col items-start justify-between mb-6">
          <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{{ image.name }}</h2>
          <p v-if="image.description" class="text-sm text-zinc-700 dark:text-zinc-300">{{ image.description }}</p>
        </div>

        <div class="flex items-center justify-center overflow-hidden rounded-xl bg-stone-100 dark:bg-zinc-800 mb-2">
          <NuxtImg
            :src="getVariantSrc(image, ['lg', 'md', 'sm'])"
            provider="hubblob"
            :alt="image.name"
            class="max-h-[70vh] w-full rounded-lg object-contain"
            @error="handleImageError"
          />
        </div>

        <div class="mb-6">
          <span class="text-sm font-classic text-zinc-700 dark:text-zinc-300">Slug : </span>
          <span class="text-sm font-classic text-zinc-700 dark:text-zinc-300 font-500">{{ image.slug }}</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <p class="text-xs text-stone-400 dark:text-zinc-500 mb-1">Views</p>
            <p class="text-sm text-zinc-700 dark:text-zinc-300">{{ image.stats_views?.toLocaleString() ?? 0 }}</p>
          </div>
          <div>
            <p class="text-xs text-stone-400 dark:text-zinc-500 mb-1">Downloads</p>
            <p class="text-sm text-zinc-700 dark:text-zinc-300">{{ image.stats_downloads?.toLocaleString() ?? 0 }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4 border-t b-dashed border-stone-200 dark:border-zinc-800">
          <NuxtLink
            :to="`/illustrations/${image.slug}`"
            target="_blank"
            class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <span class="i-ph-arrow-square-out text-sm"></span>
            View
          </NuxtLink>
          <NButton
            class="min-w-24"
            @click="$emit('edit', image)"
          >Edit</NButton>
        </div>
      </div>
    </template>
  </NDialog>
</template>

<script lang="ts" setup>
import type { Image, VariantType } from '~~/shared/types/image'

interface Props {
  isOpen: boolean
  image: Image | null
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'edit', image: Image): void
}

defineProps<Props>()
defineEmits<Emits>()

const parseVariants = (variants: string | VariantType[] | null | undefined): VariantType[] => {
  try {
    if (!variants) return []
    if (Array.isArray(variants)) return variants
    const parsed = JSON.parse(variants) as VariantType[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getVariantSrc = (row: { variants?: string | VariantType[]; pathname?: string } | null, preferredSizes: string[] = ['xxs', 'xs', 'sm']): string => {
  if (!row) return ''
  const list = parseVariants(row?.variants as any)
  let found: VariantType | undefined
  for (const size of preferredSizes) {
    found = list.find(v => v.size === size)
    if (found) break
  }
  if (!found && list.length > 0) found = list[0]
  const path = found?.pathname || row?.pathname || ''
  return path.startsWith('/') ? path : `/${path}`
}

const handleImageError = (payload: string | Event) => {
  const evt = payload as Event
  const img = evt?.target as HTMLImageElement | undefined
  if (img && 'src' in img) img.src = '/loading.jpg'
}
</script>
