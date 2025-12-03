<template>
  <div class="hidden sm:flex fixed right-4 top-3 items-center z-12 pointer-events-auto">
    <ClientOnly>
      <UDropdownMenu v-if="loggedIn" :items="userMenuItems" dropdown-menu="link-gray" :_dropdown-menu-content="{ class: 'w-48', align: 'end' }">
        <template #default>
          <UButton
            btn="ghost-gray"
            icon
            label="i-ph-user"
            aria-label="Account menu">
          </UButton>
        </template>
      </UDropdownMenu>

      <template #fallback v-if="loggedIn">
        <button
          class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center opacity-50">
          <span class="i-ph-user text-white text-lg"></span>
        </button>
      </template>

      <UButton
        v-if="!loggedIn"
        btn="soft-white"
        size="sm"
        to="/login">
        <UIcon name="i-ph-signpost" />
      </UButton>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { useUserSession } from '#imports'
const { loggedIn, clear } = useUserSession()

const userMenuItems = [
  { label: 'Settings', onClick: () => navigateTo('/settings') },
  { label: 'Logout', onClick: async () => {
      await clear()
      navigateTo('/')
    } 
  },
]
</script>
