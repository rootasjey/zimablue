<template>
  <div>
      <!-- Main Content -->
      <main>
        <!-- Access Control -->
        <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
          <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Access Denied</h2>
          <p class="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
          <UButton to="/user" class="mt-4">Go to Profile</UButton>
        </div>

        <!-- Users Management -->
        <div v-else>
          <AdminTable
            title="User Management"
            description="Manage all users in the system"
            :columns="userColumns"
            :data="users"
            :loading="isLoading"
            :pagination="pagination"
            :bulk-actions="bulkActions"
            empty-message="No users found. This shouldn't happen!"
            @search="handleSearch"
            @refresh="fetchUsers"
            @page-change="handlePageChange"
            @bulk-action="handleBulkAction"
            @edit="editUser"
            @delete="showDeleteDialog"
            @row-click="viewUser"
          >
            <!-- Custom cell renderers -->
            <template #role-cell="{ cell }">
              <span 
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  cell.value === 'admin' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                ]"
              >
                {{ cell.value }}
              </span>
            </template>

            <template #created_at-cell="{ cell }">
              {{ new Date(cell.value).toLocaleDateString() }}
            </template>

            <template #actions="{ row }">
              <div class="flex items-center gap-2">
                <UButton
                  @click="editUser(row)"
                  btn="soft-gray"
                  size="xs"
                  title="Edit user"
                >
                  <span class="i-ph-pencil"></span>
                </UButton>
                <UButton
                  @click="showDeleteDialog(row)"
                  btn="soft-red"
                  size="xs"
                  title="Delete user"
                  :disabled="row.id === user?.id"
                >
                  <span class="i-ph-trash"></span>
                </UButton>
              </div>
            </template>
          </AdminTable>
        </div>
      </main>

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
            <USelect
              v-model="editForm.role"
              :items="roleOptions"
              item-key="value"
              value-key="value"
              required
            />
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
  </div>
</template>

<script lang="ts" setup>
import type { User, UserFormData } from '~/types/user'
import type { Pagination } from '~/types/pagination'
import type { AdminTableColumn, AdminBulkAction } from '~/types/admin'

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

// Configuration
const userColumns: AdminTableColumn[] = [
  { accessorKey: 'name', header: 'Name', sortable: true },
  { accessorKey: 'email', header: 'Email', sortable: true },
  { accessorKey: 'role', header: 'Role', sortable: true },
  { accessorKey: 'job', header: 'Job' },
  { accessorKey: 'location', header: 'Location' },
  { accessorKey: 'created_at', header: 'Created', sortable: true }
]

const bulkActions: AdminBulkAction[] = [
  {
    id: 'promote_to_admin',
    label: 'Promote to Admin',
    icon: 'i-ph-crown',
    variant: 'soft-yellow',
    confirmMessage: 'Are you sure you want to promote selected users to admin?'
  },
  {
    id: 'demote_to_user',
    label: 'Demote to User',
    icon: 'i-ph-user',
    variant: 'soft-gray',
    confirmMessage: 'Are you sure you want to demote selected users to regular users?'
  }
]

const roleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' }
]

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

const handleSearch = (searchTerm: string) => {
  filters.value.search = searchTerm
  pagination.value.page = 1
  fetchUsers()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchUsers()
}

const handleBulkAction = async (actionId: string, selectedRows: User[]) => {
  // Implementation for bulk actions would go here
  console.log('Bulk action:', actionId, selectedRows)
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
  // Could navigate to user detail page or show more info
  console.log('View user:', userToView)
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
</script>
