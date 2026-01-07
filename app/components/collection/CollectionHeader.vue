<template>
  <div>
    <header ref="heroRef" class="mt-12 mb-8 max-w-3xl mx-auto">
      <!-- Main centered blog-like title and description -->
      <div class="text-center">
        <h1 class="font-title text-3xl sm:text-4xl md:text-5xl font-800 leading-tight text-gray-900 dark:text-gray-200 animate-fade-in-up">
          {{ collection?.name || 'Collection' }}
        </h1>

        <p v-if="collection?.description" class="mt-4 text-gray-600 dark:text-gray-400 max-w-prose mx-auto animate-fade-in-up animation-delay-100">
          {{ collection.description }}
        </p>
      </div>
    </header>

    <!-- Action bar: sticky only this bar. Left: name, Center: stats, Right: actions -->
    <div class="sticky top-0 z-4 bg-transparent backdrop-blur-md border-y b-dashed border-gray-200 hover:border-gray-300 dark:border-gray-700 transition-all duration-200 animate-fade-in-up animation-delay-200">
      <div
        class="w-full grid grid-cols-[auto_1fr_auto] items-center transition-all duration-200 relative"
        :class="isCompact ? 'py-1' : 'py-2'"
      >
        <!-- Left: back + avatar + name (truncate) -->
        <div class="inline-flex items-center gap-2 min-w-0 pl-2">
          <NLink to="/collections" class="w-8 h-8 inline-flex items-center justify-center rounded-md text-[rgba(var(--una-gray-600),1)] hover:bg-black/5 dark:hover:bg-white/5" aria-label="Back to collections">
            <span class="i-ph-arrow-left" aria-hidden="true"></span>
            <span class="sr-only">Back</span>
          </NLink>

          <div
            v-if="collection?.owner"
            class="rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden transition-all duration-200"
            :class="isCompact ? 'w-6 h-6' : 'w-7 h-7'"
          >
            <NuxtImg
              v-if="ownerAvatar"
              :src="ownerAvatar"
              provider="hubblob"
              :alt="collection.owner.name || 'Owner avatar'"
              class="w-full h-full object-cover"
              width="28"
              height="28"
              loading="lazy"
            />
            <span v-else class="text-[11px] font-medium text-gray-700 dark:text-gray-200">{{ ownerInitials }}</span>
          </div>

          <div
            class="hidden sm:flex font-500 text-gray-900 dark:text-gray-200 transition-all duration-200 ellipsis"
            :class="isCompact ? 'text-sm' : 'text-sm md:text-base'"
            style="min-width: 0"
          >
            {{ collection?.name || 'Collection' }}
          </div>
        </div>

        <!-- Center: compact stats pill -->
        <div class="justify-self-center absolute left-1/2 transform -translate-x-1/2">
          <div
            class="inline-flex items-center rounded-full border border-dashed border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-200"
            :class="isCompact ? 'gap-3 px-2 py-0.5 text-[12px]' : 'gap-4 px-3 py-1 text-[13px]'"
          >
            <div class="inline-flex items-center gap-1">
              <span class="i-ph-eye"></span>
              <span>{{ (collection?.stats_views || 0).toLocaleString() }}</span>
            </div>
            <div class="inline-flex items-center gap-1">
              <span class="i-ph-heart"></span>
              <span>{{ (collection?.stats_likes || 0).toLocaleString() }}</span>
            </div>
            <div class="inline-flex items-center gap-1">
              <span class="i-ph-download-simple"></span>
              <span>{{ (collection?.stats_downloads || 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- Right: actions -->
        <div class="inline-flex items-center justify-self-end gap-2 pr-2 transition-all duration-200" :class="isCompact ? 'text-[12px]' : ''">
          <template v-if="canEdit">
            <NBadge badge="solid-gray" class="whitespace-nowrap cursor-pointer hidden sm:inline-flex" :class="isCompact ? 'py-1' : ''" @click="$emit('addImages')">
              <NIcon name="i-ph-plus" class="mr-1" />
              <span>Add Images</span>
            </NBadge>

            <NBadge v-if="canEdit" badge="solid-gray" class="whitespace-nowrap cursor-pointer hidden sm:inline-flex" :class="isCompact ? 'py-1' : ''" @click="$emit('edit')">
              <NIcon name="i-ph-pencil" class="mr-1" />
              <span>Edit</span>
            </NBadge>

            <ClientOnly>
              <NDropdownMenu
                :items="menuItems"
                size="xs"
                menu-label=""
                :_dropdown-menu-content="{ class: 'w-44', align: 'end', side: 'bottom' }"
                :_dropdown-menu-trigger="{ icon: true, square: true, label: 'i-ph-dots-three', class: 'bg-transparent scale-75' }"
              />
              <template #fallback>
                <div class="flex items-center justify-center w-8 h-8 bg-transparent scale-75 opacity-50">
                  <NIcon name="i-ph-dots-three" />
                </div>
              </template>
            </ClientOnly>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collection } from '~~/shared/types/collection'

interface Props {
  collection: Collection | null
  imageCount: number
  canEdit: boolean
}

interface Emits {
  edit: []
  addImages: []
  reorder: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Computed properties for date formatting
const formattedDateLong = computed(() => {
  if (!props.collection?.created_at) return ''
  
  return new Date(props.collection.created_at).toLocaleDateString('FR-fr', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })
})

const formattedDateShort = computed(() => {
  if (!props.collection?.created_at) return ''
  
  return new Date(props.collection.created_at).toLocaleDateString('FR-fr', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

// Owner avatar (if available) and initials fallback
const ownerAvatar = computed(() => {
  const owner: any = props.collection?.owner
  if (!owner) return null
  // common avatar fields: avatar, avatar_url, photo, image
  return owner.avatar || owner.avatar_url || owner.photo || owner.image || null
})

const ownerInitials = computed(() => {
  const owner: any = props.collection?.owner
  if (!owner?.name) return ''
  const parts = owner.name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

// Collapse sticky bar when hero header scrolls out of view
const isCompact = ref(false)
const heroRef = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

onMounted(() => {
  if (!heroRef.value) return
  io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      // When header is not intersecting (scrolled past), enable compact mode
      isCompact.value = entry?.isIntersecting ?? false
    },
    { threshold: 0.01 }
  )
  io.observe(heroRef.value)
})

onBeforeUnmount(() => {
  if (io) {
    io.disconnect()
    io = null
  }
})

// Dropdown items for actions (includes add/edit + reorder if there are images)
const menuItems = computed(() => {
  const items: Array<any> = [
    {
      label: 'Add images',
      onClick: () => emit('addImages'),
    },
    {
      label: 'Edit collection',
      onClick: () => emit('edit'),
    },
  ]

  if ((props.imageCount || 0) > 0) {
    items.push({
      label: 'Reorder images',
      onClick: () => emit('reorder'),
    })
  }

  return items
})
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
}

.animation-delay-100 {
  animation-delay: 100ms;
}

.animation-delay-200 {
  animation-delay: 200ms;
}

.ellipsis {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>