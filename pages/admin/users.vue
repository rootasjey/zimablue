<template>
  <div>
    <!-- Access Control -->
    <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
      <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Access Denied</h2>
      <p class="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
      <UButton to="/user" class="mt-4">Go to Profile</UButton>
    </div>

    <!-- Users Management -->
    <div v-else>
      <!-- Header -->
      <div class="p-6 bg-white dark:bg-black rounded-t-lg border border-b-0 border-gray-200 dark:border-gray-700">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">User Management</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage all users in the system</p>
          </div>

          <div class="flex items-center gap-3">
            <UInput
              v-model="filters.search"
              placeholder="Search..."
              @keyup.enter="handleSearch(filters.search)"
              @input="debouncedSearch"
              class="w-64"
            >
              <template #leading>
                <span class="i-ph-magnifying-glass"></span>
              </template>
            </UInput>

            <UButton @click="fetchUsers" :loading="isLoading" btn="soft-gray" size="sm">
              <span class="i-ph-arrow-clockwise mr-2"></span>
              Refresh
            </UButton>
          </div>
        </div>

        <!-- Bulk Actions -->
        <div v-if="selectedUsers.length > 0" class="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedUsers.length }} selected
          </span>
          <UButton btn="soft-yellow" size="sm" @click="bulkPromote">
            <span class="i-ph-crown mr-2"></span>
            Promote to Admin
          </UButton>
          <UButton btn="soft-gray" size="sm" @click="bulkDemote">
            <span class="i-ph-user mr-2"></span>
            Demote to User
          </UButton>
          <UButton btn="soft-red" size="sm" @click="bulkDelete">
            <span class="i-ph-trash mr-2"></span>
            Delete Selected
          </UButton>
        </div>
      </div>

      <!-- Table -->
      <div class="border-x border-gray-200 dark:border-gray-700">
        <UTable
          :columns="unaColumns"
          :data="users"
          :loading="isLoading"
          row-id="id"
          :enable-row-selection="true"
          :enable-multi-row-selection="true"
          v-model:rowSelection="rowSelection"
          @row="onRowClick"
          empty-text="No users found."
        >
          <template #row_actions-cell="{ cell }">
            <UDropdownMenu
              :items="userRowMenuItems(cell.row.original)"
              size="xs"
              dropdown-menu="link-pink"
              :_dropdown-menu-content="{ class: 'w-44', align: 'start', side: 'bottom' }"
              :_dropdown-menu-trigger="{ icon: true, square: true, label: 'i-lucide-ellipsis-vertical' }"
            />
          </template>

          <template #role-cell="{ cell }">
            <span :class="['px-2 py-1 text-xs font-medium rounded-full', (cell.getValue() as string) === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400']">
              {{ cell.getValue() }}
            </span>
          </template>

          <template #created_at-cell="{ cell }">
            {{ new Date(cell.getValue() as string).toLocaleDateString() }}
          </template>

          <template #actions="{ row }">
            <div class="flex items-center gap-2">
              <UButton @click="editUser(row)" btn="soft-gray" size="xs" title="Edit user">
                <span class="i-ph-pencil"></span>
              </UButton>
              <UButton @click="showDeleteDialog(row)" btn="soft-red" size="xs" title="Delete user" :disabled="row.id === user?.id">
                <span class="i-ph-trash"></span>
              </UButton>
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="p-6 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg bg-white dark:bg-gray-800">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} to 
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of 
            {{ pagination.total }} results
          </div>

          <div class="flex items-center gap-2">
            <UButton @click="handlePageChange(pagination.page - 1)" :disabled="!pagination.hasPrev" btn="soft-gray" size="sm">
              <span class="i-ph-caret-left"></span>
            </UButton>

            <span class="text-sm text-gray-600 dark:text-gray-400 px-3">
              Page {{ pagination.page }} of {{ pagination.totalPages }}
            </span>

            <UButton @click="handlePageChange(pagination.page + 1)" :disabled="!pagination.hasNext" btn="soft-gray" size="sm">
              <span class="i-ph-caret-right"></span>
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit User Dialog -->
    <UDialog v-model:open="isEditDialogOpen" title="Edit User">
      <div class="p-6">
        <form @submit.prevent="saveUser" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
            <UInput v-model="editForm.name" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <UInput v-model="editForm.email" type="email" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
            <USelect v-model="editForm.role" :items="roleLabels" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job</label>
            <UInput v-model="editForm.job" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <UInput v-model="editForm.location" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Biography</label>
            <UTextarea v-model="editForm.biography" rows="3" />
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <UButton @click="isEditDialogOpen = false" btn="soft-gray">Cancel</UButton>
            <UButton type="submit" :loading="isSaving">Save Changes</UButton>
          </div>
        </form>
      </div>
    </UDialog>

  <!-- Delete Confirmation Dialog -->
    <UDialog v-model:open="isDeleteDialogOpen" title="Delete User">
      <div class="p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <span class="i-ph-warning text-red-600 dark:text-red-400 text-xl"></span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Delete User</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <strong>{{ selectedUser?.name }}</strong>? This action cannot be undone.
            </p>
          </div>
        </div>
        
        <div class="flex justify-end gap-3">
          <UButton @click="isDeleteDialogOpen = false" btn="soft-gray">Cancel</UButton>
          <UButton @click="deleteUser" :loading="isDeleting" btn="soft-red">Delete User</UButton>
        </div>
      </div>
    </UDialog>
</template>

<script lang="ts" setup>
import type { User, UserFormData } from '~/types/user'
import type { Pagination } from '~/types/pagination'
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

// Columns for UTable
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
      if (userIndex > -1) {
        users.value[userIndex] = response.data as unknown as User
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
