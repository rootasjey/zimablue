<template>
  <div class="space-y-6">
    <AdminTable
      title="Users"
      description="Manage all users in the system"
      :columns="unaColumns"
      :data="users"
      :loading="isLoading"
      :pagination="pagination"
      :bulk-actions="bulkActions"
      empty-message="No users found."
      @search="handleSearch"
      @refresh="fetchUsers"
      @page-change="handlePageChange"
      @bulk-action="handleBulkAction"
      @row-click="editUser"
      @edit="editUser"
      @delete="showDeleteDialog"
    >
      <!-- Name + avatar -->
      <template #name-cell="{ row }">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            :class="row.role === 'admin'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400'"
          >
            {{ (row.name || row.email || '?')[0]?.toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-36">{{ row.name || '—' }}</p>
          </div>
        </div>
      </template>

      <!-- Email -->
      <template #email-cell="{ row }">
        <p class="text-sm text-stone-500 dark:text-zinc-400 truncate max-w-44">{{ row.email }}</p>
      </template>

      <!-- Role badge -->
      <template #role-cell="{ row }">
        <span :class="[
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
          row.role === 'admin'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400'
        ]">
          <span :class="row.role === 'admin' ? 'i-ph-crown' : 'i-ph-user'" class="mr-1 text-xs"></span>
          {{ row.role }}
        </span>
      </template>

      <!-- Job -->
      <template #job-cell="{ row }">
        <span class="text-sm text-stone-500 dark:text-zinc-400">{{ row.job || '—' }}</span>
      </template>

      <!-- Location -->
      <template #location-cell="{ row }">
        <span class="text-sm text-stone-500 dark:text-zinc-400">{{ row.location || '—' }}</span>
      </template>

      <!-- Created date -->
      <template #created_at-cell="{ row }">
        <ClientOnly>
          <span class="text-sm text-stone-500 dark:text-zinc-400">
            {{ row.created_at ? new Date(typeof row.created_at === 'number' ? row.created_at * 1000 : row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' }}
          </span>
        </ClientOnly>
      </template>
    </AdminTable>

    <!-- Edit User Dialog -->
    <NDialog v-model:open="isEditDialogOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Edit User</h3>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Name</label>
              <input v-model="editForm.name" type="text" placeholder="Full name"
                class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Email</label>
              <input v-model="editForm.email" type="email" disabled
                class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none opacity-50 cursor-not-allowed" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Role</label>
              <select v-model="editForm.role"
                class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Job Title</label>
              <input v-model="editForm.job" type="text" placeholder="e.g., Designer"
                class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition" />
            </div>
            <div class="space-y-1 col-span-2">
              <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Location</label>
              <input v-model="editForm.location" type="text" placeholder="e.g., Paris, France"
                class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition" />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
              @click="isEditDialogOpen = false"
            >Cancel</button>
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
              :disabled="isSaving"
              @click="saveUser"
            >
              <span v-if="isSaving" class="i-ph-spinner-gap animate-spin mr-1.5 inline-block"></span>
              Save Changes
            </button>
          </div>
        </div>
      </template>
    </NDialog>

    <!-- Delete Confirmation Dialog -->
    <NDialog v-model:open="isDeleteDialogOpen">
      <template #content>
        <div class="p-6">
          <div class="flex items-start gap-4 mb-6">
            <div class="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
              <span class="i-ph-warning text-rose-600 dark:text-rose-400 text-xl"></span>
            </div>
            <div>
              <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Delete User</h3>
              <p class="text-sm text-stone-500 dark:text-zinc-400">
                Are you sure you want to delete <strong class="text-zinc-700 dark:text-zinc-300">{{ selectedUser?.name || selectedUser?.email }}</strong>? This action cannot be undone.
              </p>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
              @click="isDeleteDialogOpen = false"
            >Cancel</button>
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-60"
              :disabled="isDeleting"
              @click="deleteUser"
            >
              <span v-if="isDeleting" class="i-ph-spinner-gap animate-spin mr-1.5 inline-block"></span>
              Delete
            </button>
          </div>
        </div>
      </template>
    </NDialog>
  </div>
</template>

<script lang="ts" setup>
import type { User } from '~~/shared/types/user'
import type { Pagination } from '~~/shared/types/pagination'
import type { AdminBulkAction } from '~~/shared/types/admin'

type UserFormData = {
  name: string; email: string; role: string; job: string; location: string; biography: string;
}

const { user } = useUserSession()
const { toast } = useToast()

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

// State
const users = ref<User[]>([])
const selectedUser = ref<User | null>(null)
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)

const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
})

const filters = ref({
  search: '',
  role: undefined as string | undefined
})

const editForm = ref<UserFormData>({
  name: '',
  email: '',
  role: 'user',
  job: '',
  location: '',
  biography: ''
})

const unaColumns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'job', header: 'Job' },
  { accessorKey: 'location', header: 'Location' },
  { accessorKey: 'created_at', header: 'Joined' },
]

const bulkActions: AdminBulkAction[] = [
  { id: 'promote', label: 'Promote to Admin', icon: 'i-ph-crown', variant: 'soft-blue' },
  { id: 'demote', label: 'Demote to User', icon: 'i-ph-user', variant: 'soft-gray' },
  { id: 'delete_selected', label: 'Delete Selected', icon: 'i-ph-trash', variant: 'soft-red' },
]

const fetchUsers = async () => {
  isLoading.value = true
  try {
    const query = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    })
    if (filters.value.search) query.append('search', filters.value.search)
    if (filters.value.role) query.append('role', filters.value.role)

    const response = await $fetch(`/api/admin/users?${query.toString()}`)
    if (response.success) {
      users.value = response.data.users
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    toast({ title: 'Error', description: 'Failed to fetch users.', toast: 'soft-error', duration: 5000 })
  } finally {
    isLoading.value = false
  }
}

const handleSearch = (searchTerm: string) => {
  filters.value.search = searchTerm
  pagination.value.page = 1
  fetchUsers()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchUsers()
}

const handleBulkAction = async (actionId: string, selectedRows: any[]) => {
  const rows = selectedRows as User[]
  if (rows.length === 0) return

  if (actionId === 'promote') {
    for (const r of rows) {
      try { await $fetch(`/api/admin/users/${r.id}`, { method: 'PATCH', body: { role: 'admin' } }) } catch {}
    }
    toast({ title: 'Updated', description: `Promoted ${rows.length} user(s) to admin.`, toast: 'soft-success' })
    fetchUsers()
    return
  }

  if (actionId === 'demote') {
    for (const r of rows) {
      try { await $fetch(`/api/admin/users/${r.id}`, { method: 'PATCH', body: { role: 'user' } }) } catch {}
    }
    toast({ title: 'Updated', description: `Demoted ${rows.length} user(s) to user.`, toast: 'soft-success' })
    fetchUsers()
    return
  }

  if (actionId === 'delete_selected') {
    const safeRows = rows.filter(r => r.id !== user.value?.id)
    if (safeRows.length === 0) return
    const confirmed = window.confirm(`Delete ${safeRows.length} selected user${safeRows.length > 1 ? 's' : ''}? This cannot be undone.`)
    if (!confirmed) return
    for (const r of safeRows) {
      try { await $fetch(`/api/admin/users/${r.id}`, { method: 'DELETE' }) } catch {}
    }
    fetchUsers()
  }
}

const editUser = (userToEdit: User) => {
  selectedUser.value = userToEdit
  editForm.value = {
    name: userToEdit.name,
    email: userToEdit.email,
    role: userToEdit.role,
    job: userToEdit.job || '',
    location: userToEdit.location || '',
    biography: userToEdit.biography || ''
  }
  isEditDialogOpen.value = true
}

const saveUser = async () => {
  if (!selectedUser.value) return
  isSaving.value = true
  try {
    const response = await $fetch(`/api/admin/users/${selectedUser.value.id}`, { method: 'PATCH', body: editForm.value })
    if (response.success) {
      const userIndex = users.value.findIndex(u => u.id === selectedUser.value!.id)
      if (userIndex > -1 && (response as any).data) {
        users.value[userIndex] = (response as any).data as unknown as User
      }
      isEditDialogOpen.value = false
      toast({ title: 'Saved', description: 'User updated successfully', toast: 'soft-success', duration: 3000 })
    }
  } catch (error) {
    console.error('Error updating user:', error)
    toast({ title: 'Error', description: 'Failed to update user.', toast: 'soft-error', duration: 5000 })
  } finally {
    isSaving.value = false
  }
}

const showDeleteDialog = (userToDelete: User) => {
  selectedUser.value = userToDelete
  isDeleteDialogOpen.value = true
}

const deleteUser = async () => {
  if (!selectedUser.value) return
  isDeleting.value = true
  try {
    const response = await $fetch(`/api/admin/users/${selectedUser.value.id}`, { method: 'DELETE' })
    if (response.success) {
      users.value = users.value.filter(u => u.id !== selectedUser.value!.id)
      isDeleteDialogOpen.value = false
      pagination.value.total--
      toast({ title: 'Deleted', description: 'User deleted successfully', toast: 'soft-success', duration: 3000 })
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    toast({ title: 'Error', description: 'Failed to delete user.', toast: 'soft-error', duration: 5000 })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => fetchUsers())
</script>
