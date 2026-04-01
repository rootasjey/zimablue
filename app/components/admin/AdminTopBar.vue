<template>
  <header class="admin-topbar sticky top-0 z-30">
    <div class="mx-auto max-w-screen-2xl px-5 py-4 md:px-7">
      <div class="flex flex-row items-center justify-between">
        <div class="min-w-0 flex-1 flex items-center">
          <NuxtLink to="/" aria-label="Zima Blue - retour à l'accueil" class="mr-3 flex-shrink-0">
            <img src="/images/logo-192.png" alt="Zima Blue" class="h-6 w-6 rounded-lg object-contain" />
          </NuxtLink>
          <NNavigationMenu
            :items="navigationItems"
            indicator
            size="sm"
            navigation-menu="ghost-white"
            navigation-menu-link="ghost-white"
          />
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition-colors hover:bg-stone-50 hover:text-zinc-900 sm:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Open admin command palette"
            @click="$emit('open-command-dialog')"
          >
            <span class="i-ph-command text-base"></span>
          </button>

          <button
            type="button"
            class="relative hidden h-9 w-56 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-stone-400 transition-colors hover:bg-stone-50 sm:inline-flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800"
            @click="$emit('open-command-dialog')"
          >
            <span class="i-ph-command text-sm"></span>
            <span class="flex-1 text-left text-xs">Go to a page or run an action…</span>
            <kbd class="inline-flex items-center gap-0.5 rounded bg-stone-100 px-1.5 py-0.5 text-[11px] font-mono text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">
              <span>⌘K</span>
            </kbd>
          </button>

          <button
            class="relative flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 transition-all hover:bg-stone-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            @click="$emit('open-notifications')"
            aria-label="Notifications"
          >
            <span class="i-ph-bell text-lg"></span>
            <span
              v-if="unreadMessagesCount > 0"
              class="absolute right-1.5 top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white"
            >
              {{ unreadMessagesCount > 99 ? '99+' : unreadMessagesCount }}
            </span>
          </button>

          <NuxtLink
            to="/"
            class="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 transition-all hover:bg-stone-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="View public site"
            target="_blank"
          >
            <span class="i-ph-arrow-square-out text-lg"></span>
          </NuxtLink>

          <div class="mx-1 hidden h-5 w-px bg-stone-200 dark:bg-zinc-700 md:block"></div>

          <NuxtLink to="/admin/settings" class="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-stone-100 dark:hover:bg-zinc-800 group">
            <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold uppercase text-white">
              {{ userInitials }}
            </div>
            <span class="hidden max-w-[96px] truncate text-xs font-medium text-zinc-700 transition-colors group-hover:text-zinc-900 md:block dark:text-zinc-300 dark:group-hover:text-zinc-100">
              {{ userName }}
            </span>
          </NuxtLink>
        </div>
      </div>
    </div>

  </header>
</template>

<script lang="ts" setup>
interface Props {
  unreadCount?: number
}

interface AdminNavChildItem {
  label: string
  description: string
  to: string
  active?: boolean
}

interface AdminNavItem {
  label: string
  value: string
  to?: string
  active?: boolean
  description?: string
  items?: AdminNavChildItem[]
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'open-notifications'): void
  (e: 'open-command-dialog'): void
}>()

const { user } = useUserSession()
const route = useRoute()
const unreadMessagesCount = computed(() => props.unreadCount ?? 0)

const userName = computed(() => user.value?.name || 'Admin')
const userInitials = computed(() => {
  const name = userName.value
  return name.substring(0, 2).toUpperCase()
})

const isCurrentRoute = (path: string) => {
  return route.path === path || route.path.startsWith(`${path}/`)
}

const navigationItems = computed<any[]>(() => {
  return [
    {
      label: 'Dashboard',
      value: 'dashboard',
      to: '/admin',
      active: route.path === '/admin',
    },
    {
      label: 'Content',
      value: 'content',
      active: isCurrentRoute('/admin/images') || isCurrentRoute('/admin/collections') || isCurrentRoute('/admin/tags'),
      items: [
        {
          label: 'Images',
          description: 'Manage uploads, visibility and quick edits.',
          to: '/admin/images',
          active: isCurrentRoute('/admin/images'),
        },
        {
          label: 'Collections',
          description: 'Organize illustrations into public or private series.',
          to: '/admin/collections',
          active: isCurrentRoute('/admin/collections'),
        },
        {
          label: 'Tags',
          description: 'Classify work and improve discoverability.',
          to: '/admin/tags',
          active: isCurrentRoute('/admin/tags'),
        },
      ],
    },
    {
      label: unreadMessagesCount.value > 0 ? `Messages (${unreadMessagesCount.value > 99 ? '99+' : unreadMessagesCount.value})` : 'Messages',
      value: 'messages',
      to: '/admin/messages',
      active: isCurrentRoute('/admin/messages'),
    },
    {
      label: 'Workspace',
      value: 'workspace',
      active: isCurrentRoute('/admin/users') || isCurrentRoute('/admin/todos') || isCurrentRoute('/admin/analytics') || isCurrentRoute('/admin/tools'),
      items: [
        {
          label: 'Users',
          description: 'Review roles, profiles and account access.',
          to: '/admin/users',
          active: isCurrentRoute('/admin/users'),
        },
        {
          label: 'Todos',
          description: 'Track production tasks and next actions.',
          to: '/admin/todos',
          active: isCurrentRoute('/admin/todos'),
        },
        {
          label: 'Analytics',
          description: 'Monitor growth, engagement and top content.',
          to: '/admin/analytics',
          active: isCurrentRoute('/admin/analytics'),
        },
        {
          label: 'Tools',
          description: 'Run maintenance and import or export utilities.',
          to: '/admin/tools',
          active: isCurrentRoute('/admin/tools'),
        },
      ],
    },
    {
      label: 'Settings',
      value: 'settings',
      to: '/admin/settings',
      active: isCurrentRoute('/admin/settings'),
    },
  ]
})

</script>
