<template>
  <div class="hidden sm:flex fixed right-4 top-3 items-center z-12 pointer-events-auto">
    <ClientOnly>
      <NDropdownMenu v-if="loggedIn" :items="userMenuItems" dropdown-menu="link-gray" :_dropdown-menu-content="{ class: 'w-48', align: 'end' }">
        <template #default>
          <NButton
            btn="ghost-gray"
            icon
            label="i-ph-identification-badge"
            aria-label="Account menu"
          />
        </template>
      </NDropdownMenu>

      <template #fallback v-if="loggedIn">
        <NButton
          btn="ghost-gray"
          icon
          label="i-ph-identification-badge"
          aria-label="Account menu"
        />
      </template>

      <NButton
        v-if="!loggedIn"
        btn="soft-white"
        size="sm"
        to="/login">
        <NIcon name="i-ph-user-focus-duotone" />
      </NButton>
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
