<template>
  <div class="relative group">
    <!-- Main Hero Header -->
    <header ref="heroRef" class="pt-20 pb-16 px-4">
      <div class="max-w-4xl mx-auto text-center space-y-8">
        <!-- Collection Metadata -->
        <div class="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 text-[11px] font-700 uppercase tracking-widest text-gray-500 animate-in zoom-in-95 duration-700">
          <span class="i-ph-folder-simple-user text-blue-500"></span>
          Collection <span class="mx-1 opacity-30">|</span> {{ imageCount }} images
        </div>

        <!-- Title & Description -->
        <div class="space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <h1 class="font-body text-4xl sm:text-5xl md:text-7xl font-900 leading-[1.1] tracking-tight text-gray-900 dark:text-gray-100">
            {{ collection?.name || 'Untitled' }}
          </h1>

          <p v-if="collection?.description" class="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-body">
            {{ collection.description }}
          </p>
        </div>

        <!-- Creator & Stats -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 animate-in fade-in duration-700 delay-200">
          <div v-if="collection?.owner" class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <NuxtImg
                v-if="ownerAvatar"
                :src="ownerAvatar"
                provider="hubblob"
                :alt="collection.owner.name || 'Owner'"
                class="w-full h-full object-cover"
                width="40"
                height="40"
              />
              <span v-else class="text-xs font-800 text-gray-600 dark:text-gray-400">{{ ownerInitials }}</span>
            </div>
            <div class="text-left">
              <div class="text-[10px] font-700 uppercase tracking-wider text-gray-400">Curated by</div>
              <div class="text-sm font-700 text-gray-900 dark:text-gray-100">{{ collection.owner.name }}</div>
            </div>
          </div>

          <div class="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-800"></div>

          <div class="flex items-center gap-6 text-gray-500 dark:text-gray-400">
            <div class="flex flex-col items-center">
              <span class="text-lg font-700 text-gray-900 dark:text-gray-100">{{ (collection?.stats_views || 0).toLocaleString() }}</span>
              <span class="text-[10px] font-700 uppercase tracking-widest opacity-60">Views</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="text-lg font-700 text-gray-900 dark:text-gray-100">{{ (collection?.stats_likes || 0).toLocaleString() }}</span>
              <span class="text-[10px] font-700 uppercase tracking-widest opacity-60">Likes</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Sticky Action Navigator -->
    <div 
      class="sticky top-0 z-40 transition-all duration-500 border-y border-dashed border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl"
      :class="[
        isCompact ? 'py-2 translate-y-0 opacity-100 shadow-sm' : 'py-3',
      ]"
    >
      <div class="w-full max-w-[1600px] mx-auto px-4 flex items-center justify-between gap-4">
        <!-- Left: Back & Title -->
        <div class="flex items-center gap-3 min-w-0">
          <NLink 
            to="/collections" 
            class="group/back w-10 h-10 inline-flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <span class="i-ph-arrow-left text-lg group-hover/back:-translate-x-1 transition-transform"></span>
          </NLink>

          <div class="flex flex-col min-w-0">
             <h2 
              class="font-800 text-gray-900 dark:text-gray-100 truncate transition-all duration-300"
              :class="isCompact ? 'text-lg opacity-100' : 'text-sm opacity-50'"
            >
              {{ collection?.name }}
            </h2>
            <div v-if="!isCompact" class="text-[10px] font-700 uppercase tracking-widest text-gray-400">Collection</div>
          </div>
        </div>

        <!-- Center: Stats (shown only when compact) -->
        <div 
          v-if="isCompact"
          class="hidden md:flex items-center gap-8 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div class="flex items-center gap-2 group/stat">
            <span class="i-ph-eye text-gray-400 group-hover/stat:text-blue-500 transition-colors"></span>
            <span class="text-xs font-700 text-gray-700 dark:text-gray-300">{{ collection?.stats_views }}</span>
          </div>
          <div class="flex items-center gap-2 group/stat">
            <span class="i-ph-heart text-gray-400 group-hover/stat:text-red-500 transition-colors"></span>
            <span class="text-xs font-700 text-gray-700 dark:text-gray-300">{{ collection?.stats_likes }}</span>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2">
          <template v-if="canEdit">
            <NButton 
              btn="soft-gray" 
              size="sm" 
              class="hidden sm:inline-flex font-700 rounded-xl px-4" 
              @click="$emit('addImages')"
            >
              <span class="i-ph-plus mr-2"></span>
              Add
            </NButton>

            <NButton 
              btn="ghost-gray" 
              size="sm" 
              un-icon 
              class="p-2.5 rounded-xl"
              @click="$emit('edit')"
            >
              <span class="i-ph-pencil-line text-lg"></span>
            </NButton>

            <ClientOnly>
              <NDropdownMenu
                :items="menuItems"
                size="xs"
                :_dropdown-menu-content="{ class: 'w-48 rounded-2xl p-2 shadow-xl', align: 'end', side: 'bottom' }"
                :_dropdown-menu-trigger="{ 
                  icon: true, 
                  square: true, 
                  label: 'i-ph-dots-three-bold', 
                  class: 'rounded-xl w-10 h-10 bg-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800' 
                }"
              />
            </ClientOnly>
          </template>
          
          <NButton 
            v-else
            btn="soft-gray"
            size="sm"
            class="rounded-xl px-5 font-700"
          >
            <span class="i-ph-share-network mr-2"></span>
            Share
          </NButton>
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
      isCompact.value = !(entry?.isIntersecting ?? true)
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