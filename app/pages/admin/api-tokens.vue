<template>
  <div class="space-y-6">
    <AdminTable
      title="API Tokens"
      description="Manage active API tokens for mobile and desktop apps."
      :columns="columns"
      :data="tokens"
      :loading="isLoading"
      :pagination="pagination"
      empty-message="No API tokens found."
      @search="handleSearch"
      @refresh="fetchTokens"
      @page-change="handlePageChange"
    >
      <template #status-cell="{ row }">
        <span v-if="row.revoked" class="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Revoked</span>
        <span v-else-if="isExpired(row.expires_at)" class="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Expired</span>
        <span v-else class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
      </template>
      <template #actions-cell="{ row }">
        <NButton
          v-if="!row.revoked"
          color="soft-red"
          size="sm"
          @click="revokeToken(row)"
        >
          Revoke
        </NButton>
      </template>
    </AdminTable>

    <NDialog v-model:open="showRevokeDialog">
      <NDialogContent>
        <NDialogHeader>
          <NDialogTitle>Revoke token</NDialogTitle>
          <NDialogDescription>
            Are you sure you want to revoke <strong>{{ tokenToRevoke?.name }}</strong>?
            The app using this token will lose access until a new login is performed.
          </NDialogDescription>
        </NDialogHeader>
        <NDialogFooter>
          <NButton color="soft-gray" @click="showRevokeDialog = false">Cancel</NButton>
          <NButton color="red" @click="confirmRevoke">Revoke</NButton>
        </NDialogFooter>
      </NDialogContent>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

import type { AdminTableColumn } from '~~/shared/types/admin'

const columns: AdminTableColumn[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'user_name', header: 'User' },
  { accessorKey: 'created_at', header: 'Created', hideOnMobile: true },
  { accessorKey: 'expires_at', header: 'Expires', hideOnMobile: true },
  { accessorKey: 'last_used_at', header: 'Last used', hideOnMobile: true },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: '' },
]

const tokens = ref<any[]>([])
const isLoading = ref(false)
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false })
const showRevokeDialog = ref(false)
const tokenToRevoke = ref<any>(null)
let searchQuery = ''

function isExpired(date: string | number | null): boolean {
  if (!date) return false
  return new Date(date).getTime() < Date.now()
}

async function fetchTokens() {
  isLoading.value = true
  try {
    const res = await $fetch<any>('/api/admin/api-tokens', {
      query: { page: pagination.value.page, limit: pagination.value.limit, search: searchQuery },
    })
    tokens.value = res.data || []
    pagination.value = res.pagination
  } catch (e) {
    console.error('Failed to fetch tokens:', e)
    tokens.value = []
  } finally {
    isLoading.value = false
  }
}

function handleSearch(query: string) {
  searchQuery = query
  pagination.value.page = 1
  fetchTokens()
}

function handlePageChange(page: number) {
  pagination.value.page = page
  fetchTokens()
}

function revokeToken(token: any) {
  tokenToRevoke.value = token
  showRevokeDialog.value = true
}

async function confirmRevoke() {
  if (!tokenToRevoke.value) return
  try {
    await $fetch(`/api/admin/api-tokens/${tokenToRevoke.value.id}`, { method: 'DELETE' })
    showRevokeDialog.value = false
    tokenToRevoke.value = null
    fetchTokens()
  } catch (e) {
    console.error('Failed to revoke token:', e)
  }
}

onMounted(() => fetchTokens())
</script>
