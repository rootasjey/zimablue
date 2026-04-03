<template>
  <nav class="fixed bottom-0 left-0 right-0 z-12 sm:hidden" role="navigation" aria-label="Main navigation">
    <div class="pointer-events-none flex w-full justify-center">
      <div class="pointer-events-auto mb-2 flex w-[min(96%,720px)] items-center gap-2 rounded-[32px] border border-white/10 bg-black px-4 py-3 text-gray-200/90 shadow-lg shadow-black/10 backdrop-blur-md dark:bg-black/90">
        <template v-for="item in primaryMobileItems" :key="item.key">
          <NuxtLink
            :to="item.to || '#'"
            class="group relative flex flex-1 items-center justify-center"
            :aria-label="item.label"
            @click.prevent="handleNavItemClick(item)"
            @auxclick.prevent="handleNavItemClick(item)"
            @keydown.enter.prevent="handleNavItemClick(item)"
            @keydown.space.prevent="handleNavItemClick(item)"
          >
            <div class="nav-pill flex flex-row items-center rounded-[28px] p-2 text-gray-200" :class="{ 'bg-white/10 shadow-inner': isActive(item) }">
              <div class="flex h-8 w-8 items-center justify-center rounded-2xl transition-colors hover:bg-white/10">
                <i :class="item.icon + ' text-xl text-gray-200/90'" />
              </div>
              <span class="nav-label text-xs font-medium color-white" :class="{ 'nav-label-active': isActive(item) }">
                {{ item.label }}
              </span>
            </div>
          </NuxtLink>
        </template>

        <ClientOnly>
          <NDropdownMenu
            :items="overflowMenuItems"
            size="xs"
            menu-label="More"
            :_dropdown-menu-content="{ class: 'w-44', align: 'end', side: 'top' }"
          >
            <NButton
              icon
              size="small"
              rounded="full"
              btn="ghost-gray"
              label="i-ph-dots-three-vertical"
              aria-label="More navigation options"
            />
          </NDropdownMenu>
          <template #fallback>
            <NButton
              icon
              size="small"
              rounded="full"
              btn="ghost-gray"
              label="i-ph-dots-three-vertical"
              aria-label="More navigation options"
            />
          </template>
        </ClientOnly>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import type { SiteNavigationAction } from '~/composables/useSiteNavigation'
import { useSiteNavigation } from '~/composables/useSiteNavigation'

const route = useRoute()
const { handleActionClick, mobileOverflowItems, primaryMobileItems } = useSiteNavigation()

type Item = SiteNavigationAction

const overflowMenuItems = computed(() => mobileOverflowItems.value.map((item) => ({
  label: item.label,
  onClick: () => handleActionClick(item),
})))

function isActive(item: Item) {
  return item.match ? item.match(route.path) : route.path === item.to
}

function handleNavItemClick(item: Item) {
  handleActionClick(item)
}
</script>

<style scoped>
a {
  min-height: 44px;
  min-width: 44px;
}

.nav-pill {
  transition: background-color 160ms ease;
}

.nav-label {
  white-space: nowrap;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  margin-right: 0;
  transition: max-width 220ms ease, opacity 180ms ease, margin-right 220ms ease;
}

.nav-label-active {
  max-width: 10rem;
  opacity: 1;
  margin-right: 0.5rem;
}
</style>
