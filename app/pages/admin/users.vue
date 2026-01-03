<template>
  <div>
    <!-- Access Control -->
    <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
      <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
      <h2 class="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
      <p class="text-gray-600">You need admin privileges to access this page.</p>
      <NButton to="/user" class="mt-4">Go to Profile</NButton>
    </div>

    <!-- Users Management -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-700 text-gray-900 dark:text-gray-200">User Management</h1>
          <p class="text-gray-600 dark:text-gray-300 mt-1">Manage all users in the system</p>
        </div>
      </div>

      <!-- Search and Actions Card -->
      <div class="rounded-[28px] p-6 bg-[#D1E0E9] dark:bg-gray-800">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <NInput
            v-model="filters.search"
            placeholder="Search users..."
            @keyup.enter="handleSearch(filters.search)"
            @input="debouncedSearch"
            size="sm"
            class="flex-1 b-black focus-within:border-blue-300 dark:b-gray-700"
            rounded="6"
          >
            <template #leading>
              <span class="i-ph-magnifying-glass"></span>
            </template>
          </NInput>

          <NButton @click="fetchUsers" :loading="isLoading" btn="light:soft-blue dark:solid-gray" size="sm" rounded="6">
            <span class="i-ph-arrow-clockwise mr-2"></span>
            Refresh
          </NButton>
        </div>

        <!-- Bulk Actions -->
        <div v-if="selectedUsers.length > 0" class="flex items-center gap-2 mt-4 pt-4 border-t border-[#b7cbd8]">
          <span class="text-sm font-600 text-gray-700">
            {{ selectedUsers.length }} selected
          </span>
          <NButton btn="soft-gray" size="sm" @click="bulkPromote">
            <span class="i-ph-crown mr-2"></span>
            Promote to Admin
          </NButton>
          <NButton btn="soft-gray" size="sm" @click="bulkDemote">
            <span class="i-ph-user mr-2"></span>
            Demote to User
          </NButton>
          <NButton btn="soft-error" size="sm" @click="bulkDelete">
            <span class="i-ph-trash mr-2"></span>
            Delete Selected
          </NButton>
        </div>
      </div>

      <!-- Table Card -->
      <div class="rounded-[28px] bg-[#D1E0E9] dark:bg-gray-800 overflow-hidden">
        <div class="p-6">
          <NTable
          :columns="unaColumns"
          :data="users"
          :loading="isLoading"
          row-id="id"
          :enable-row-selection="true"
          :enable-multi-row-selection="true"
          v-model:rowSelection="rowSelection"
          @row="onRowClick"
          empty-text="No users found."
          :una="{
            tableRoot: 'rounded-[28px] b-transparent',
            tableHead: 'b-transparent',
            tableRow: 'b-transparent cursor-pointer hover:bg-[#000000]/5',
            tableLoadingRow: 'bg-[#D1DFE9] b-[#D1DFE9] dark:bg-gray-700/50',
            tableEmpty: 'bg-[#D1DFE9] b-[#D1DFE9] dark:bg-gray-700/50',
            tableCell: 'table-cell',
          }"
        >
          <template #row_actions-cell="{ cell }">
            <ClientOnly>
              <NDropdownMenu
                :items="userRowMenuItems(cell.row.original)"
                size="xs"
                dropdown-menu="link-black"
                :_dropdown-menu-content="{ class: 'w-44', align: 'start', side: 'bottom' }"
                :_dropdown-menu-trigger="{ icon: true, square: true, label: 'i-lucide-ellipsis-vertical' }"
              />
              <template #fallback>
                <div class="w-8 h-8 grid place-items-center text-gray-500">
                  <span class="i-lucide-ellipsis-vertical"></span>
                </div>
              </template>
            </ClientOnly>
          </template>

          <template #role-cell="{ cell }">
            <span :class="['px-2 py-1 text-xs font-medium rounded-full', (cell.getValue() as string) === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400']">
              {{ cell.getValue() }}
            </span>
          </template>

          <template #created_at-cell="{ cell }">
            <ClientOnly>
              {{ new Date(cell.getValue() as string).toLocaleDateString() }}
              <template #fallback>
                {{ (cell.getValue() as string).slice(0, 10) }}
              </template>
            </ClientOnly>
          </template>

          <template #actions="{ row }">
            <div class="flex items-center gap-2">
              <NButton @click="editUser(row)" btn="soft-gray" size="xs" title="Edit user">
                <span class="i-ph-pencil"></span>
              </NButton>
              <NButton @click="showDeleteDialog(row)" btn="soft-red" size="xs" title="Delete user" :disabled="row.id === user?.id">
                <span class="i-ph-trash"></span>
              </NButton>
            </div>
          </template>
        </NTable>
        </div>

        <!-- Pagination -->
        <div v-if="pagination && pagination.totalPages > 1" class="px-6 pb-6">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-600 dark:text-gray-300">
              Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} to
              {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of
              {{ pagination.total }} results
            </div>

            <div class="flex items-center gap-2">
              <NButton @click="handlePageChange(pagination.page - 1)" :disabled="!pagination.hasPrev" btn="soft-gray" size="sm">
                <span class="i-ph-caret-left"></span>
              </NButton>

              <span class="text-sm text-gray-600 px-3">
                Page {{ pagination.page }} of {{ pagination.totalPages }}
              </span>

              <NButton @click="handlePageChange(pagination.page + 1)" :disabled="!pagination.hasNext" btn="soft-gray" size="sm">
                <span class="i-ph-caret-right"></span>
              </NButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Dialog -->
    <NDialog v-model:open="isEditDialogOpen" title="Edit User">
      <div class="p-6">
        <form @submit.prevent="saveUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
            <NInput v-model="editForm.name" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <NInput v-model="editForm.email" type="email" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
            <NSelect v-model="editForm.role" :items="roleLabels" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job</label>
            <NInput v-model="editForm.job" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <NInput v-model="editForm.location" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Biography</label>
            <NTextarea v-model="editForm.biography" rows="3" />
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <NButton @click="isEditDialogOpen = false" btn="soft-gray">Cancel</NButton>
            <NButton type="submit" :loading="isSaving">Save Changes</NButton>
          </div>
        </form>
      </div>
    </NDialog>

    <!-- Delete Confirmation Dialog -->
    <NDialog v-model:open="isDeleteDialogOpen" title="Delete User">
      <div class="p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <span class="i-ph-warning text-red-600 dark:text-red-400 text-xl"></span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-200">Delete User</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <strong>{{ selectedUser?.name }}</strong>? This action cannot be undone.
            </p>
          </div>
        </div>
        
        <div class="flex justify-end gap-3">
          <NButton @click="isDeleteDialogOpen = false" btn="soft-gray">Cancel</NButton>
          <NButton @click="deleteUser" :loading="isDeleting" btn="soft-red">Delete User</NButton>
        </div>
      </div>
    </NDialog>
  </div>
</template>

<script lang="ts" setup>
import type { User, UserFormData } from '~~/shared/types/user'
import type { Pagination } from '~~/shared/types/pagination'
import type { RowSelectionState } from '@tanstack/vue-table'

const { loggedIn, user } = useUserSession()
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
const rowSelection = ref<RowSelectionState>({})

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

// Columns for NTable
const unaColumns = [
  { id: 'row_actions', header: '', enableSorting: false },
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'email', header: 'Email', enableSorting: true },
  { accessorKey: 'role', header: 'Role', enableSorting: true },
  { accessorKey: 'job', header: 'Job', enableSorting: false },
  { accessorKey: 'location', header: 'Location', enableSorting: false },
  { accessorKey: 'created_at', header: 'Created', enableSorting: true }
]

const selectedUsers = computed(() => {
  const selected = new Set(
    Object.entries(rowSelection.value)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
  )
  return users.value.filter(u => selected.has(String(u.id)))
})

const roleLabels = ['user', 'admin']

// Methods
const fetchUsers = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return
  
  isLoading.value = true
  try {
    const query = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    })

    if (filters.value.search) {
      query.append('search', filters.value.search)
    }

    if (filters.value.role) {
      query.append('role', filters.value.role)
    }

    const response = await $fetch(`/api/admin/users?${query.toString()}`)
    
    if (response.success) {
      users.value = response.data.users
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    toast({
      title: 'Error',
      description: 'Failed to fetch users. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isLoading.value = false
  }
}

let searchTimeout: any
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 400)
}

const handleSearch = (searchTerm?: string) => {
  filters.value.search = searchTerm ?? ''
  pagination.value.page = 1
  fetchUsers()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchUsers()
}

const bulkPromote = async () => {
  const rows = selectedUsers.value
  for (const r of rows) {
    try { await $fetch(`/api/admin/users/${r.id}`, { method: 'PATCH', body: { role: 'admin' } }) } catch {}
  }
  fetchUsers()
}

const bulkDemote = async () => {
  const rows = selectedUsers.value
  for (const r of rows) {
    try { await $fetch(`/api/admin/users/${r.id}`, { method: 'PATCH', body: { role: 'user' } }) } catch {}
  }
  fetchUsers()
}

const bulkDelete = async () => {
  const rows = selectedUsers.value.filter(r => r.id !== user.value?.id)
  if (rows.length === 0) return
  const confirmed = window.confirm(`Delete ${rows.length} selected user${rows.length > 1 ? 's' : ''}? This cannot be undone.`)
  if (!confirmed) return
  for (const r of rows) {
    try { await $fetch(`/api/admin/users/${r.id}`, { method: 'DELETE' }) } catch {}
  }
  fetchUsers()
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
    const response = await $fetch(`/api/admin/users/${selectedUser.value.id}`, {
      method: 'PATCH',
      body: editForm.value
    })

    if (response.success) {
      // Update local state
      const userIndex = users.value.findIndex(u => u.id === selectedUser.value!.id)
      if (userIndex > -1 && (response as any).data) {
        users.value[userIndex] = (response as any).data as unknown as User
      }

      isEditDialogOpen.value = false
      toast({
        title: 'Success',
        description: 'User updated successfully',
        toast: 'soft-success',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('Error updating user:', error)
    toast({
      title: 'Error',
      description: 'Failed to update user. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isSaving.value = false
  }
}

const viewUser = (userToView: User) => {
  // Keep simple: open edit
  editUser(userToView)
}

const showDeleteDialog = (userToDelete: User) => {
  selectedUser.value = userToDelete
  isDeleteDialogOpen.value = true
}

const deleteUser = async () => {
  if (!selectedUser.value) return
  
  isDeleting.value = true
  try {
    const response = await $fetch(`/api/admin/users/${selectedUser.value.id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      // Remove from local state
      users.value = users.value.filter(u => u.id !== selectedUser.value!.id)
      
      isDeleteDialogOpen.value = false
      pagination.value.total--

      toast({
        title: 'Success',
        description: 'User deleted successfully',
        toast: 'soft-success',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    toast({
      title: 'Error',
      description: 'Failed to delete user. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isDeleting.value = false
  }
}

// Lifecycle
onMounted(() => {
  if (loggedIn.value && user.value?.role === 'admin') {
    fetchUsers()
  }
})

watch([loggedIn, () => user.value?.role], ([newLoggedIn, newRole]) => {
  if (newLoggedIn && newRole === 'admin') {
    fetchUsers()
  }
})

// Row click
const onRowClick = (event: Event, row: User) => {
  const target = event.target as HTMLElement
  if (target.closest('button') || target.closest('a') || target.closest('input')) return
  viewUser(row)
}

// Row dropdown items
const userRowMenuItems = (row: User) => [
  { label: 'Edit', onClick: () => editUser(row) },
  { label: 'Delete', onClick: () => showDeleteDialog(row) },
]
</script>
