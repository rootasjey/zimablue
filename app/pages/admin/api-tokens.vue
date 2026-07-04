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
      <template #header-tabs>
        <button
          class="flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-100 px-3 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-200 hover:text-zinc-900 sm:h-8 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
          @click="openCreateDialog"
        >
          <span class="i-ph-plus text-sm"></span>
          New Token
        </button>
      </template>
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

    <!-- Create Token Dialog -->
    <NDialog v-model:open="showCreateDialog">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">New API Token</h3>

          <div class="space-y-1">
            <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Name *</label>
            <input v-model="createForm.name" type="text" placeholder="My App"
              class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 transition" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">User *</label>
            <select v-model="createForm.userId"
              class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
            >
              <option value="" disabled>Select a user</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }} ({{ u.email }})</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Expiration</label>
            <select v-model="createForm.expiresInDays"
              class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
            >
              <option :value="0">Never expires</option>
              <option :value="7">7 days</option>
              <option :value="30">30 days</option>
              <option :value="90">90 days</option>
              <option :value="365">1 year</option>
            </select>
          </div>

          <div v-if="createError" class="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-600 dark:text-red-400">
            {{ createError }}
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
              @click="showCreateDialog = false"
            >Cancel</button>
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-60"
              :disabled="!createForm.name.trim() || !createForm.userId || isCreating"
              @click="handleCreate"
            >
              <span v-if="isCreating" class="i-ph-spinner-gap animate-spin mr-1.5 inline-block"></span>
              Create Token
            </button>
          </div>
        </div>
      </template>
    </NDialog>

    <!-- Token Created Dialog -->
    <NDialog v-model:open="showTokenDialog">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Token created</h3>
          <p class="text-sm text-stone-500 dark:text-zinc-400">Copy this token now. You won't be able to see it again.</p>
          <div class="relative">
            <pre class="p-4 rounded-lg bg-zinc-900 text-green-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all select-all">{{ createdToken }}</pre>
            <button
              class="absolute top-2 right-2 p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              @click="copyCreatedToken"
              :title="copied ? 'Copied!' : 'Copy to clipboard'"
            >
              <span :class="copied ? 'i-ph-check-circle text-green-400' : 'i-ph-copy-simple'"></span>
            </button>
          </div>
          <div class="flex justify-end pt-2">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
              @click="showTokenDialog = false; copied = false"
            >Done</button>
          </div>
        </div>
      </template>
    </NDialog>

    <!-- Revoke Dialog -->
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

// Create state
const showCreateDialog = ref(false)
const showTokenDialog = ref(false)
const isCreating = ref(false)
const createError = ref('')
const createdToken = ref('')
const copied = ref(false)
const users = ref<any[]>([])
const createForm = ref({ name: '', userId: 0, expiresInDays: 0 })

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

async function openCreateDialog() {
  createForm.value = { name: '', userId: 0, expiresInDays: 0 }
  createError.value = ''
  try {
    const res = await $fetch<any>('/api/admin/users', { query: { limit: 200 } })
    users.value = res.data || []
  } catch {
    users.value = []
  }
  showCreateDialog.value = true
}

async function handleCreate() {
  if (!createForm.value.name.trim() || !createForm.value.userId) return
  isCreating.value = true
  createError.value = ''
  try {
    const res = await $fetch<any>('/api/admin/api-tokens', {
      method: 'POST',
      body: {
        name: createForm.value.name.trim(),
        userId: createForm.value.userId,
        expiresInDays: createForm.value.expiresInDays > 0 ? createForm.value.expiresInDays : undefined,
      },
    })
    showCreateDialog.value = false
    createdToken.value = res.data.token
    showTokenDialog.value = true
    fetchTokens()
  } catch (e: any) {
    createError.value = e?.data?.message || 'Failed to create token.'
  } finally {
    isCreating.value = false
  }
}

async function copyCreatedToken() {
  try {
    await navigator.clipboard.writeText(createdToken.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}

onMounted(() => fetchTokens())
</script>
