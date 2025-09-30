<template>
  <USidebar sidebar="floating" collapsible="icon" class="my-6 ml-2 h-96%">
    <template #header>
      <div class="flex items-center gap-2 px-2 py-1">
        <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <span class="i-ph-gear-six text-white text-lg"></span>
        </div>
        
        <div>
          <h1 class="font-600 -mb-1">Admin</h1>
          <span class="text-size-3 text-gray-500 dark:text-gray-400">Admin Panel</span>
        </div>
      </div>
    </template>

    <template #content>
    <USidebarGroup label="Manage">
    <USidebarMenu>
      <USidebarMenuItem>
            <NuxtLink to="/admin">
                <USidebarMenuButton :is-active="isActive('/admin')" tooltip="Dashboard">
                <span class="i-ph-house-simple-duotone" />
                <span>Dashboard</span>
              </USidebarMenuButton>
            </NuxtLink>
          </USidebarMenuItem>

          <USidebarMenuItem>
            <NuxtLink to="/admin/images">
                <USidebarMenuButton :is-active="startsWith('/admin/images')" tooltip="Images">
                <span class="i-ph-image-duotone" />
                <span>Images</span>
              </USidebarMenuButton>
            </NuxtLink>
          </USidebarMenuItem>

          <USidebarMenuItem>
            <NuxtLink to="/admin/tags">
                <USidebarMenuButton :is-active="startsWith('/admin/tags')" tooltip="Tags">
                <span class="i-ph-hash-straight" />
                <span>Tags</span>
              </USidebarMenuButton>
            </NuxtLink>
          </USidebarMenuItem>

          <USidebarMenuItem>
            <NuxtLink to="/admin/collections">
                <USidebarMenuButton :is-active="startsWith('/admin/collections')" tooltip="Collections">
                <span class="i-ph-folder-duotone" />
                <span>Collections</span>
              </USidebarMenuButton>
            </NuxtLink>
          </USidebarMenuItem>

          <USidebarMenuItem>
            <NuxtLink to="/admin/users">
                <USidebarMenuButton :is-active="startsWith('/admin/users')" tooltip="Users">
                <span class="i-ph-users-duotone" />
                <span>Users</span>
              </USidebarMenuButton>
            </NuxtLink>
          </USidebarMenuItem>

          <USidebarMenuItem>
            <NuxtLink to="/admin/messages">
                <USidebarMenuButton :is-active="startsWith('/admin/messages')" tooltip="Messages">
                <span class="i-ph-envelope-duotone" />
                <span>Messages</span>
                <USidebarMenuBadge v-if="unreadCount && unreadCount > 0">{{ unreadCount }}</USidebarMenuBadge>
              </USidebarMenuButton>
            </NuxtLink>
          </USidebarMenuItem>

          <USidebarMenuItem>
            <NuxtLink to="/admin/tools">
                <USidebarMenuButton :is-active="startsWith('/admin/tools')" tooltip="Tools">
                <span class="i-ph-wrench" />
                <span>Tools</span>
              </USidebarMenuButton>
            </NuxtLink>
          </USidebarMenuItem>
        </USidebarMenu>
      </USidebarGroup>
    </template>

    <template #footer>
      <div class="flex items-center gap-3 px-2 py-2">
        <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <span class="i-ph-user text-gray-600 dark:text-gray-400"></span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ user?.name }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
        </div>
      </div>
    </template>
  </USidebar>
</template>

<script lang="ts" setup>
interface Props {
  unreadCount?: number
}

const props = defineProps<Props>()

const route = useRoute()
const { user } = useUserSession()

const isActive = (path: string) => route.path === path
const startsWith = (prefix: string) => route.path.startsWith(prefix)

// expose unreadCount for template checks
const unreadCount = toRef(props, 'unreadCount')
</script>
