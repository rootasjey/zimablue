<template>
  <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
    <div class="p-6">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
          <span class="i-ph-gear-six text-white text-lg"></span>
        </div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
      </div>

      <nav class="space-y-2">
        <ULink
          to="/admin"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="$route.path === '/admin' 
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
        >
          <span class="i-ph-house-simple-duotone text-lg"></span>
          Dashboard
        </ULink>

        <ULink
          to="/admin/users"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="$route.path.startsWith('/admin/users') 
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
        >
          <span class="i-ph-users-duotone text-lg"></span>
          Users
        </ULink>

        <ULink
          to="/admin/images"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="$route.path.startsWith('/admin/images') 
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
        >
          <span class="i-ph-image-duotone text-lg"></span>
          Images
        </ULink>

        <ULink
          to="/admin/collections"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="$route.path.startsWith('/admin/collections') 
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' 
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
        >
          <span class="i-ph-folder-duotone text-lg"></span>
          Collections
        </ULink>

        <ULink
          to="/admin/messages"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="$route.path.startsWith('/admin/messages')
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
        >
          <span class="i-ph-envelope-duotone text-lg"></span>
          Messages
          <span v-if="unreadCount && unreadCount > 0" class="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {{ unreadCount }}
          </span>
        </ULink>
      </nav>
    </div>

    <div class="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <span class="i-ph-user text-gray-600 dark:text-gray-400"></span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ user?.name }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ user?.email }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script lang="ts" setup>
interface Props {
  unreadCount?: number
}

defineProps<Props>()

const { user } = useUserSession()
</script>
