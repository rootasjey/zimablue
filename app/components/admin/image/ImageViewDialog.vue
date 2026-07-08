<template>
  <NDialog
    :open="isOpen"
    @update:open="$emit('update:isOpen', $event)"
    :show-close="false"
    :ui="{ width: 'max-w-4xl' }"
  >
    <template #content>
      <div v-if="image" class="max-h-[85vh] overflow-y-auto">
        <div class="pb-0 flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              <NTooltip content="Image ID">
                <span class="text-sm font-mono text-stone-400 dark:text-zinc-500 font-normal">#{{ image.id }}</span>
              </NTooltip>
              {{ image.name }}
            </h2>
            <div class="flex items-center gap-2 mt-1">
              <NTooltip content="Click to copy slug">
                <span
                  class="inline-flex items-center gap-1 text-xs text-stone-400 dark:text-zinc-500 cursor-pointer hover:text-stone-600 dark:hover:text-zinc-300 transition-colors"
                  @click="copySlug"
                >
                  <span class="i-ph-link-simple"></span>
                  <code class="font-mono px-1 py-0.5 rounded bg-stone-100 dark:bg-zinc-800">{{ image.slug }}</code>
                </span>
              </NTooltip>
            </div>
            <p v-if="image.description" class="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
              {{ image.description }}
            </p>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">

            <NTooltip content="View on site">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                @click="openOnSite"
              >
                <span class="i-ph-arrow-square-out text-lg"></span>
              </button>
            </NTooltip>

            <NTooltip content="Edit image">
              <WarmZebraButton
                size="sm"
                variant="primary"
                icon-only
                @click="$emit('edit', image)"
              >
                <span class="i-ph-pencil-simple"></span>
              </WarmZebraButton>
            </NTooltip>

            <NTooltip content="Close">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                @click="$emit('update:isOpen', false)"
              >
                <span class="i-ph-x text-lg"></span>
              </button>
            </NTooltip>
          </div>
        </div>

        <div class="pt-4">
          <div class="flex items-center justify-center rounded-xl bg-stone-100 dark:bg-zinc-800/60 p-4">
            <div class="relative">
              <NuxtImg
                :src="getVariantSrc(image, ['lg', 'md', 'sm'])"
                provider="hubblob"
                :alt="image.name"
                class="max-h-[55vh] w-full rounded-lg object-contain"
                @error="handleImageError"
              />
              <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-xs bg-black/50 text-white backdrop-blur-sm">
                {{ image.w }} × {{ image.h }}
              </div>
            </div>
          </div>
        </div>

        <div class="pt-6 grid grid-cols-4 gap-4">
          <div class="flex flex-col items-center gap-2 rounded-lg bg-stone-50 dark:bg-zinc-800/40 p-3 text-center">
            <NTooltip content="Views">
              <span class="i-tabler-eye text-lg text-stone-400 dark:text-zinc-500 mx-auto"></span>
            </NTooltip>
            <p class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
              {{ image.stats_views?.toLocaleString() ?? 0 }}
            </p>
          </div>

          <div class="flex flex-col items-center gap-2 rounded-lg bg-stone-50 dark:bg-zinc-800/40 p-3 text-center">
            <NTooltip content="Downloads">
              <span class="i-tabler-download text-lg text-stone-400 dark:text-zinc-500 mx-auto"></span>
            </NTooltip>
            <p class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
              {{ image.stats_downloads?.toLocaleString() ?? 0 }}
            </p>
          </div>

          <div class="flex flex-col items-center gap-2 rounded-lg bg-stone-50 dark:bg-zinc-800/40 p-3 text-center">
            <NTooltip content="Likes">
              <span class="i-tabler-heart-broken text-lg text-stone-400 dark:text-zinc-500 mx-auto"></span>
            </NTooltip>
            <p class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
              {{ image.stats_likes?.toLocaleString() ?? 0 }}
            </p>
          </div>

          <div class="flex flex-col items-center gap-2 rounded-lg bg-stone-50 dark:bg-zinc-800/40 p-3 text-center">
            <NTooltip :content="isNew ? 'Created' : 'Updated'">
              <span class="i-tabler-calendar-event-filled text-lg text-stone-400 dark:text-zinc-500 mb-1 mx-auto"></span>
            </NTooltip>
            <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
              {{ formatDate(isNew ? image.created_at : image.updated_at) }}
            </p>
          </div>
        </div>

        <div class="pb-6">
          <div v-if="displayTags.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="tag in displayTags"
              :key="tag.name"
              :style="getTagBadgeStyles(tag.color)"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-[var(--tag-bg)] text-[var(--tag-text)] dark:bg-[var(--tag-bg-dark)] dark:text-[var(--tag-text-dark)]"
            >
              {{ tag.name }}
            </span>
          </div>

          <div v-if="image.aspect_label" class="flex items-center gap-1.5 mt-3 text-sm text-zinc-500 dark:text-zinc-400 bg-stone-50 dark:bg-zinc-800/40 p-3 rounded-lg">
            <span class="i-ph-crop text-xs text-stone-400 dark:text-zinc-500"></span>
            <span>{{ image.aspect_label }}</span>
          </div>
        </div>
      </div>
    </template>
  </NDialog>
</template>

<script lang="ts" setup>
import type { Image, VariantType } from '~~/shared/types/image'
import { useTagColor } from '~/composables/useTagColor'
import { useImageActions } from '~/composables/image/useImageActions'

interface Props {
  isOpen: boolean
  image: Image | null
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'edit', image: Image): void
}

const props = defineProps<Props>()
defineEmits<Emits>()
const { toast } = useToast()

const { normalizeTags } = useImageActions()
const { getTagBadgeStyles } = useTagColor()

const displayTags = computed(() => {
  const img = props.image as any
  const tags = img?.tags ?? img?.tag_names ?? []
  return normalizeTags(tags)
})

const isNew = computed(() => {
  if (!props.image) return true
  return props.image.created_at === props.image.updated_at
})

function formatDate(date: string | undefined): string {
  if (!date) return '—'
  const d = new Date(typeof date === 'number' ? date * 1000 : date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function copySlug() {
  if (!props.image?.slug) return
  try {
    await navigator.clipboard.writeText(props.image.slug)
    toast({ title: 'Copied', description: 'Slug copied to clipboard.', toast: 'soft-success' })
  } catch {
    toast({ title: 'Failed', description: 'Could not copy slug.', toast: 'soft-error' })
  }
}

function openOnSite() {
  if (!props.image?.slug) return
  window.open(`/illustrations/${props.image.slug}`, '_blank')
}

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
