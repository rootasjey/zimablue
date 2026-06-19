<template>
  <NDialog :open="isOpen" @update:open="$emit('update:isOpen', $event)" :_dialog="{ class: 'w-[calc(100vw-1rem)] sm:max-w-xl' }">
    <template #content>
      <div class="p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Manage Aspect Variants</h2>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors"
            @click="$emit('update:isOpen', false)"
          >
            <span class="i-ph-x text-lg" />
          </button>
        </div>

        <p class="text-sm text-stone-500 dark:text-zinc-400">
          Link other illustrations as aspect ratio variants of <strong class="text-zinc-700 dark:text-zinc-300">{{ image?.name }}</strong>.
          Each variant appears in the download menu on the public pages.
        </p>

        <!-- Primary image -->
        <div class="flex items-center gap-3 p-3 rounded-lg bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700">
          <NuxtImg
            :src="getThumbSrc(image)"
            provider="hubblob"
            :alt="image?.name"
            class="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-stone-100 dark:bg-zinc-800"
            @error="handleImgError"
          />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ image?.name }}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium">Primary</span>
              <span class="text-xs text-stone-500 dark:text-zinc-400">{{ primaryLabel }}</span>
            </div>
          </div>
        </div>

        <!-- Current variants -->
        <div v-if="variants.length > 0" class="space-y-2">
          <p class="text-xs font-medium text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Variants ({{ variants.length }})</p>
          <div
            v-for="variant in variants"
            :key="variant.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-stone-200 dark:border-zinc-700"
          >
            <NuxtImg
              :src="getThumbSrc(variant)"
              provider="hubblob"
              :alt="variant.name"
              class="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-stone-100 dark:bg-zinc-800"
              @error="handleImgError"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ variant.name }}</p>
              <select
                :value="variant.aspect_label"
                @change="updateLabel(variant, ($event.target as HTMLSelectElement).value)"
                class="mt-0.5 text-xs px-2 py-0.5 rounded border border-stone-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 outline-none focus:ring-1 focus:ring-indigo-500/40"
              >
                <option v-for="l in aspectLabels" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>
            <button
              class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 transition-colors"
              :title="'Unlink ' + variant.name"
              @click="removeVariant(variant)"
            >
              <span class="i-ph-link-break text-base" />
            </button>
          </div>
        </div>

        <div v-else class="py-6 text-center text-sm text-stone-400 dark:text-zinc-500 border-2 border-dashed border-stone-200 dark:border-zinc-700 rounded-lg">
          No aspect variants yet. Add one below.
        </div>

        <!-- Add variant form -->
        <div class="border-t border-stone-200 dark:border-zinc-700 pt-4">
          <button
            v-if="!showAddForm"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            @click="openAddForm"
          >
            <span class="i-ph-plus-circle text-base" />
            Add Aspect Variant
          </button>

          <div v-else class="space-y-3">
            <div class="space-y-1">
              <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Search for an image</label>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Type to search images..."
                class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                @input="debouncedSearch"
              />
            </div>

            <div v-if="isSearching" class="flex items-center gap-2 text-sm text-stone-500 dark:text-zinc-400 py-2">
              <span class="i-ph-spinner-gap animate-spin" />
              Searching...
            </div>

            <div v-else-if="searchResults.length > 0" class="max-h-48 overflow-y-auto space-y-1 border border-stone-200 dark:border-zinc-700 rounded-lg p-1">
              <button
                v-for="result in searchResults"
                :key="result.id"
                class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                :class="{ 'ring-2 ring-indigo-500/40 bg-indigo-50 dark:bg-indigo-900/20': selectedResult?.id === result.id }"
                @click="selectedResult = result"
              >
                <NuxtImg
                  :src="getThumbSrc(result)"
                  provider="hubblob"
                  :alt="result.name"
                  class="w-8 h-8 rounded object-cover flex-shrink-0 bg-stone-100 dark:bg-zinc-800"
                  @error="handleImgError"
                />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ result.name }}</p>
                  <p class="text-xs text-stone-400 dark:text-zinc-500 truncate">{{ result.pathname }}</p>
                </div>
              </button>
            </div>

            <div v-else-if="searchQuery && !isSearching" class="text-sm text-stone-400 dark:text-zinc-500 py-2">
              No results found.
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Aspect label</label>
              <select
                v-model="newLabel"
                class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              >
                <option v-for="l in aspectLabels" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>

            <div class="flex justify-end gap-2 pt-1">
              <button
                class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
                @click="closeAddForm"
              >
                Cancel
              </button>
              <button
                class="px-4 h-9 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-50"
                :disabled="!selectedResult || isAdding"
                @click="addVariant"
              >
                <span v-if="isAdding" class="i-ph-spinner-gap animate-spin mr-1.5 inline-block" />
                Add Variant
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </NDialog>
</template>

<script lang="ts" setup>
import type { Image, VariantType } from '~~/shared/types/image'

const ASPECT_LABELS = ['Portrait', 'Paysage', 'Carré'] as const

interface Props {
  isOpen: boolean
  image: Image | null
  variants: Image[]
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'update:variants', variants: Image[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { toast } = useToast()
const { showErrorToast } = useErrorToast()

const aspectLabels = ASPECT_LABELS

const primaryLabel = computed(() => props.image?.aspect_label || 'Portrait')

const showAddForm = ref(false)
const searchQuery = ref('')
const searchResults = ref<Image[]>([])
const selectedResult = ref<Image | null>(null)
const newLabel = ref('Paysage')
const isSearching = ref(false)
const isAdding = ref(false)
const searchTimeout = ref<ReturnType<typeof setTimeout>>()

function openAddForm() {
  showAddForm.value = true
  searchQuery.value = ''
  searchResults.value = []
  selectedResult.value = null
  newLabel.value = 'Paysage'
}

function closeAddForm() {
  showAddForm.value = false
  searchQuery.value = ''
  searchResults.value = []
  selectedResult.value = null
}

function debouncedSearch() {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  searchTimeout.value = setTimeout(() => performSearch(), 300)
}

async function performSearch() {
  if (!searchQuery.value.trim()) return
  isSearching.value = true
  try {
    const q = new URLSearchParams({ search: searchQuery.value, limit: '10' })
    const resp: any = await $fetch(`/api/admin/images?${q.toString()}`)
    if (resp.success) {
      // Exclude the current image and already-linked variants
      const excludeIds = new Set([props.image?.id, ...props.variants.map(v => v.id)])
      searchResults.value = (resp.data.images || []).filter(
        (img: Image) => !excludeIds.has(img.id)
      )
    }
  } catch {
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

async function addVariant() {
  if (!selectedResult.value || !props.image) return
  isAdding.value = true
  try {
    await $fetch(`/api/admin/images/${props.image.id}/aspect-variants`, {
      method: 'POST',
      body: {
        variantImageId: selectedResult.value.id,
        label: newLabel.value,
      },
    })
    // Refresh
    const updated = await fetchVariants(props.image.id)
    emit('update:variants', updated)
    closeAddForm()
  } catch (error) {
    showErrorToast(error, 'Error', 'Failed to add aspect variant.')
  } finally {
    isAdding.value = false
  }
}

async function updateLabel(variant: Image, label: string) {
  try {
    await $fetch(`/api/admin/images/${props.image!.id}/aspect-variants/${variant.id}`, {
      method: 'PATCH',
      body: { label },
    })
    const updated = await fetchVariants(props.image!.id)
    emit('update:variants', updated)
  } catch (error) {
    showErrorToast(error, 'Error', 'Failed to update label.')
  }
}

async function removeVariant(variant: Image) {
  if (!props.image) return
  try {
    await $fetch(`/api/admin/images/${props.image.id}/aspect-variants/${variant.id}`, {
      method: 'DELETE',
    })
    const updated = await fetchVariants(props.image.id)
    emit('update:variants', updated)
  } catch (error) {
    showErrorToast(error, 'Error', 'Failed to unlink variant.')
  }
}

async function fetchVariants(imageId: number): Promise<Image[]> {
  try {
    const resp: any = await $fetch(`/api/images/slug/${props.image?.slug}`)
    return resp?.aspect_variants || []
  } catch {
    return []
  }
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

const getThumbSrc = (row: { variants?: string | VariantType[]; pathname?: string } | null) => {
  if (!row) return ''
  const list = parseVariants(row.variants as any)
  const found = list.find(v => v.size === 'xxs' || v.size === 'xs' || v.size === 'sm')
  const path = found?.pathname || row.pathname || ''
  return path.startsWith('/') ? path : `/${path}`
}

const handleImgError = (payload: string | Event) => {
  const evt = payload as Event
  const img = evt?.target as HTMLImageElement | undefined
  if (img) img.style.display = 'none'
}
</script>
