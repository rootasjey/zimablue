<template>
  <NDialog
    :open="open"
    @update:open="handleOpenChange"
    :ui="{
      width: 'w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] lg:w-full lg:max-w-3xl',
      height: 'max-h-[80vh]'
    }"
    :_dialog-close="{
      btn: 'ghost-gray absolute right-3 top-3 z-10'
    }"
  >
    <div class="flex max-h-[80vh] max-w-full flex-col overflow-x-hidden">
      <div class="p-4 border-b border-stone-200 dark:border-zinc-700">
        <NInput
          ref="searchInputRef"
          v-model="query"
          placeholder="Go to a page or run an admin action..."
          autofocus
          class="w-full"
          @keydown="handleInputKeydown"
          role="combobox"
          :aria-expanded="filteredCommands.length > 0"
          :aria-activedescendant="activeDescendant"
          aria-autocomplete="list"
          aria-label="Admin command palette"
        >
          <template #leading>
            <span class="i-ph-command text-sm text-stone-400 dark:text-zinc-500"></span>
          </template>
          <template #trailing>
            <div class="hidden items-center gap-2 -mr-2 lg:flex">
              <kbd class="rounded-2 border border-stone-200 px-1.5 py-0.5 text-[11px] text-stone-500 dark:border-zinc-700 dark:text-zinc-400">{{ shortcutLabel }}</kbd>
            </div>
          </template>
        </NInput>

        <div class="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-stone-500 dark:text-zinc-400">
          <div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <span>{{ filteredCommands.length }} commands</span>
            <div v-if="filteredCommands.length > 0" class="hidden items-center gap-2 sm:flex">
              <kbd class="rounded border border-stone-200 px-1.5 py-0.5 dark:border-zinc-700">↑↓</kbd>
              <span>navigate</span>
              <kbd class="rounded border border-stone-200 px-1.5 py-0.5 dark:border-zinc-700">↵</kbd>
              <span>run</span>
            </div>
          </div>
          <div class="flex flex-shrink-0 items-center gap-2">
            <kbd class="rounded border border-stone-200 px-1.5 py-0.5 dark:border-zinc-700">ESC</kbd>
            <span class="hidden sm:inline">Admin only</span>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto overflow-x-hidden py-2" role="listbox" :aria-activedescendant="activeDescendant">
        <div v-if="groupedCommands.length === 0" class="flex items-center justify-center px-6 py-14 text-center">
          <div>
            <span class="i-ph-magnifying-glass block text-3xl text-stone-300 dark:text-zinc-600"></span>
            <p class="mt-3 text-sm text-zinc-700 dark:text-zinc-200">No matching commands</p>
            <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">Try a page name, like images or settings, or an action like upload.</p>
          </div>
        </div>

        <div v-else>
          <section v-for="group in groupedCommands" :key="group.label" class="mb-4 last:mb-0">
            <div class="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-zinc-500">
              {{ group.label }}
            </div>

            <div class="px-2">
              <button
                v-for="command in group.items"
                :id="`admin-command-${command.index}`"
                :key="command.id"
                type="button"
                class="flex w-full min-w-0 items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors"
                :class="command.index === selectedIndex
                  ? 'bg-blue-50 text-zinc-950 dark:bg-blue-500/10 dark:text-zinc-100'
                  : 'text-zinc-700 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800/80'"
                role="option"
                :aria-selected="command.index === selectedIndex"
                @mouseenter="selectedIndex = command.index"
                @click="executeCommand(command)"
              >
                <span
                  class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  :class="command.iconClass"
                >
                  <span :class="[command.icon, 'text-lg']"></span>
                </span>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="truncate text-sm font-medium">{{ command.label }}</p>
                    <span
                      v-if="command.badge"
                      class="inline-flex items-center rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-600 dark:bg-zinc-700 dark:text-zinc-300"
                    >
                      {{ command.badge }}
                    </span>
                  </div>
                  <p class="truncate text-xs text-stone-500 dark:text-zinc-400">{{ command.description }}</p>
                </div>

                <div class="flex flex-shrink-0 items-center gap-2 text-xs text-stone-400 dark:text-zinc-500">
                  <span v-if="command.hint" class="hidden sm:inline">{{ command.hint }}</span>
                  <span :class="command.kind === 'action' ? 'i-ph-lightning' : 'i-ph-arrow-up-right'"></span>
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </NDialog>
</template>

<script lang="ts" setup>
interface Props {
  open: boolean
  unreadCount?: number
}

interface BaseCommand {
  id: string
  label: string
  description: string
  group: 'navigation' | 'actions'
  icon: string
  iconClass: string
  keywords: string[]
  hint?: string
  badge?: string
}

interface RouteCommand extends BaseCommand {
  kind: 'route'
  to: string
}

interface ActionCommand extends BaseCommand {
  kind: 'action'
  action: 'upload-images' | 'create-collection'
}

type Command = RouteCommand | ActionCommand
type IndexedCommand = Command & { index: number }

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'upload-images'): void
  (e: 'create-collection'): void
}>()

const route = useRoute()
const router = useRouter()

const searchInputRef = ref<{ focus?: () => void } | null>(null)
const query = ref('')
const selectedIndex = ref(0)

const isMac = computed(() => {
  if (import.meta.client) {
    return navigator.platform.toUpperCase().includes('MAC')
  }

  return false
})

const shortcutLabel = computed(() => isMac.value ? '⌘K' : 'Ctrl+K')

const isCurrentRoute = (path: string) => route.path === path || route.path.startsWith(`${path}/`)

const commands = computed<Command[]>(() => {
  const unreadBadge = props.unreadCount && props.unreadCount > 0
    ? props.unreadCount > 99 ? '99+' : String(props.unreadCount)
    : undefined

  return [
    {
      id: 'nav-dashboard',
      label: 'Dashboard',
      description: 'Jump back to the admin overview.',
      group: 'navigation',
      kind: 'route',
      to: '/admin',
      icon: 'i-ph-squares-four',
      iconClass: isCurrentRoute('/admin') && route.path === '/admin'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
        : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300',
      keywords: ['home', 'overview', 'dashboard'],
      hint: route.path === '/admin' ? 'Current page' : 'Page'
    },
    {
      id: 'nav-images',
      label: 'Images',
      description: 'Manage uploads, visibility and image metadata.',
      group: 'navigation',
      kind: 'route',
      to: '/admin/images',
      icon: 'i-ph-image',
      iconClass: isCurrentRoute('/admin/images')
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
        : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300',
      keywords: ['image', 'media', 'uploads', 'gallery'],
      hint: isCurrentRoute('/admin/images') ? 'Current page' : 'Page'
    },
    {
      id: 'nav-collections',
      label: 'Collections',
      description: 'Review and organize collection structure.',
      group: 'navigation',
      kind: 'route',
      to: '/admin/collections',
      icon: 'i-ph-folder',
      iconClass: isCurrentRoute('/admin/collections')
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
        : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300',
      keywords: ['collection', 'series', 'folders'],
      hint: isCurrentRoute('/admin/collections') ? 'Current page' : 'Page'
    },
    {
      id: 'nav-tags',
      label: 'Tags',
      description: 'Manage taxonomy and discoverability.',
      group: 'navigation',
      kind: 'route',
      to: '/admin/tags',
      icon: 'i-ph-hash-straight',
      iconClass: isCurrentRoute('/admin/tags')
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
        : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300',
      keywords: ['tags', 'taxonomy', 'labels'],
      hint: isCurrentRoute('/admin/tags') ? 'Current page' : 'Page'
    },
    {
      id: 'nav-messages',
      label: 'Messages',
      description: 'Open visitor messages and unread conversations.',
      group: 'navigation',
      kind: 'route',
      to: '/admin/messages',
      icon: 'i-ph-envelope',
      iconClass: isCurrentRoute('/admin/messages')
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
        : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300',
      keywords: ['messages', 'inbox', 'contact'],
      hint: isCurrentRoute('/admin/messages') ? 'Current page' : 'Page',
      badge: unreadBadge,
    },
    {
      id: 'nav-users',
      label: 'Users',
      description: 'Review roles, profiles and account access.',
      group: 'navigation',
      kind: 'route',
      to: '/admin/users',
      icon: 'i-ph-users-three',
      iconClass: isCurrentRoute('/admin/users')
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
        : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300',
      keywords: ['users', 'accounts', 'roles'],
      hint: isCurrentRoute('/admin/users') ? 'Current page' : 'Page'
    },
    {
      id: 'nav-todos',
      label: 'Todos',
      description: 'Track open tasks and production follow-ups.',
      group: 'navigation',
      kind: 'route',
      to: '/admin/todos',
      icon: 'i-ph-check-square-offset',
      iconClass: isCurrentRoute('/admin/todos')
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
        : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300',
      keywords: ['todo', 'tasks', 'kanban'],
      hint: isCurrentRoute('/admin/todos') ? 'Current page' : 'Page'
    },
    {
      id: 'nav-analytics',
      label: 'Analytics',
      description: 'Inspect traffic, reach and performance trends.',
      group: 'navigation',
      kind: 'route',
      to: '/admin/analytics',
      icon: 'i-ph-chart-line-up',
      iconClass: isCurrentRoute('/admin/analytics')
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
        : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300',
      keywords: ['analytics', 'stats', 'traffic'],
      hint: isCurrentRoute('/admin/analytics') ? 'Current page' : 'Page'
    },
    {
      id: 'nav-tools',
      label: 'Tools',
      description: 'Run maintenance and import-export utilities.',
      group: 'navigation',
      kind: 'route',
      to: '/admin/tools',
      icon: 'i-ph-toolbox',
      iconClass: isCurrentRoute('/admin/tools')
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
        : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300',
      keywords: ['tools', 'maintenance', 'import', 'export'],
      hint: isCurrentRoute('/admin/tools') ? 'Current page' : 'Page'
    },
    {
      id: 'nav-settings',
      label: 'Settings',
      description: 'Adjust preferences and account settings.',
      group: 'navigation',
      kind: 'route',
      to: '/admin/settings',
      icon: 'i-ph-sliders-horizontal',
      iconClass: isCurrentRoute('/admin/settings')
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
        : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300',
      keywords: ['settings', 'preferences', 'account'],
      hint: isCurrentRoute('/admin/settings') ? 'Current page' : 'Page'
    },
    {
      id: 'action-upload',
      label: 'Upload images',
      description: 'Open the file picker and start an upload immediately.',
      group: 'actions',
      kind: 'action',
      action: 'upload-images',
      icon: 'i-ph-upload-simple',
      iconClass: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
      keywords: ['upload', 'images', 'files', 'add'],
      hint: 'Action'
    },
    {
      id: 'action-create-collection',
      label: 'Create collection',
      description: 'Open the collection creation dialog without leaving the page.',
      group: 'actions',
      kind: 'action',
      action: 'create-collection',
      icon: 'i-ph-folder-plus',
      iconClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
      keywords: ['create', 'collection', 'series', 'new'],
      hint: 'Action'
    }
  ]
})

const filteredCommands = computed<IndexedCommand[]>(() => {
  const normalizedQuery = query.value.trim().toLowerCase()
  const filtered = normalizedQuery.length === 0
    ? commands.value
    : commands.value.filter((command) => {
        const haystack = [command.label, command.description, ...command.keywords, command.group].join(' ').toLowerCase()
        return haystack.includes(normalizedQuery)
      })

  return filtered.map((command, index) => ({ ...command, index }))
})

const groupedCommands = computed(() => {
  const groups: Array<{ label: string, items: IndexedCommand[] }> = []

  const navigation = filteredCommands.value.filter(command => command.group === 'navigation')
  const actions = filteredCommands.value.filter(command => command.group === 'actions')

  if (navigation.length > 0) {
    groups.push({ label: 'Navigation', items: navigation })
  }

  if (actions.length > 0) {
    groups.push({ label: 'Actions', items: actions })
  }

  return groups
})

const activeDescendant = computed(() => {
  if (filteredCommands.value.length === 0) {
    return undefined
  }

  return `admin-command-${selectedIndex.value}`
})

const focusInput = () => {
  nextTick(() => {
    searchInputRef.value?.focus?.()
  })
}

const handleOpenChange = (value: boolean) => {
  emit('update:open', value)
}

const scrollSelectedIntoView = () => {
  nextTick(() => {
    const selectedElement = document.getElementById(`admin-command-${selectedIndex.value}`)
    selectedElement?.scrollIntoView({ block: 'nearest' })
  })
}

const moveSelection = (direction: 1 | -1) => {
  if (filteredCommands.value.length === 0) {
    return
  }

  const nextIndex = selectedIndex.value + direction

  if (nextIndex < 0) {
    selectedIndex.value = filteredCommands.value.length - 1
  } else if (nextIndex >= filteredCommands.value.length) {
    selectedIndex.value = 0
  } else {
    selectedIndex.value = nextIndex
  }

  scrollSelectedIntoView()
}

const executeCommand = async (command: IndexedCommand) => {
  emit('update:open', false)

  if (command.kind === 'route') {
    if (route.path !== command.to) {
      await router.push(command.to)
    }
    return
  }

  if (command.action === 'upload-images') {
    emit('upload-images')
    return
  }

  emit('create-collection')
}

const handleInputKeydown = async (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      moveSelection(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveSelection(-1)
      break
    case 'Enter':
      event.preventDefault()
      const selectedCommand = filteredCommands.value[selectedIndex.value]
      if (selectedCommand) {
        await executeCommand(selectedCommand)
      }
      break
    case 'Escape':
      event.preventDefault()
      emit('update:open', false)
      break
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    selectedIndex.value = 0
    focusInput()
  }
})

watch(query, () => {
  selectedIndex.value = 0
})

watch(filteredCommands, (nextCommands) => {
  if (nextCommands.length === 0) {
    selectedIndex.value = 0
    return
  }

  if (selectedIndex.value > nextCommands.length - 1) {
    selectedIndex.value = nextCommands.length - 1
  }
})
</script>