<template>
  <div>
    <!-- Access Control -->
    <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
      <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
      <h2 class="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
      <p class="text-gray-600">You need admin privileges to access this page.</p>
      <UButton to="/user" class="mt-4">Go to Profile</UButton>
    </div>

    <!-- Todos Management -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl sm:text-3xl font-700 text-gray-900 dark:text-white">To-Do List</h1>
            <p class="text-gray-600 dark:text-gray-300 mt-1">Manage your art projects and upcoming tasks.</p>
        </div>
        <UButton
          @click="openCreateDialog"
          btn="solid-black"
          size="xs"
        >
          <span class="i-ph-plus mr-2"></span>
          New Task
        </UButton>
      </div>

      <!-- Filters -->
      <div class="rounded-[28px] p-4 bg-[#D1E0E9] dark:bg-gray-800">
        <div class="flex flex-wrap gap-3">
          <UButton
            v-for="statusFilter in statusFilters"
            :key="statusFilter.value"
            @click="selectedStatus = selectedStatus === statusFilter.value ? '' : statusFilter.value"
            :btn="selectedStatus === statusFilter.value ? 'solid-black' : 'soft-gray'"
            size="sm"
            rounded="6"
          >
            <span :class="statusFilter.icon" class="mr-2"></span>
            {{ statusFilter.label }}
          </UButton>
          
          <div class="ml-auto flex gap-2">
            <UButton
              v-for="priorityFilter in priorityFilters"
              :key="priorityFilter.value"
              @click="selectedPriority = selectedPriority === priorityFilter.value ? '' : priorityFilter.value"
              :btn="selectedPriority === priorityFilter.value ? 'solid-black' : 'soft-gray'"
              size="sm"
              rounded="6"
            >
              {{ priorityFilter.label }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="grid grid-cols-1 gap-4">
        <div v-for="n in 3" :key="n" class="rounded-[28px] p-6 bg-[#D1E0E9] animate-pulse h-32"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="todos.length === 0" class="rounded-[28px] p-12 bg-[#D1E0E9] dark:bg-gray-800 text-center">
        <span class="i-ph-check-square text-2xl mb-4"></span>
        <h3 class="text-xl font-600">No tasks found</h3>
        <p class="mb-4">Create your first task to get started!</p>
        <UButton @click="openCreateDialog" btn="solid-black">
          <span class="i-ph-plus mr-2"></span>
          Create Task
        </UButton>
      </div>

      <!-- Todos List -->
      <div v-else class="space-y-4">
        <div
          v-for="todo in todos"
          :key="todo.id"
          class="rounded-[28px] p-6 bg-[#D1E0E9] border border-[#b7cbd8] hover:shadow-md transition-shadow"
        >
          <div class="flex items-start gap-4">
            <!-- Status Checkbox -->
            <button
              @click="toggleTodoStatus(todo)"
              class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 transition-colors"
              :class="todo.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-gray-300 hover:border-gray-400'"
            >
              <span v-if="todo.status === 'completed'" class="i-ph-check text-lg"></span>
            </button>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 mb-2">
                <h3
                  class="text-lg font-700 text-gray-900"
                  :class="{ 'line-through text-gray-500': todo.status === 'completed' }"
                >
                  {{ todo.title }}
                </h3>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <!-- Priority Badge -->
                  <span
                    class="px-2 py-1 rounded-full text-xs font-700"
                    :class="getPriorityClass(todo.priority)"
                  >
                    {{ todo.priority }}
                  </span>
                  
                  <!-- Actions -->
                  <UButton @click="openEditDialog(todo)" btn="soft-gray" size="sm">
                    <span class="i-ph-pencil"></span>
                  </UButton>
                  <UButton @click="openDeleteDialog(todo)" btn="soft-error" size="sm">
                    <span class="i-ph-trash"></span>
                  </UButton>
                </div>
              </div>

              <p v-if="todo.description" class="text-gray-600 mb-3">{{ todo.description }}</p>

              <div class="flex items-center gap-4 text-sm text-gray-600">
                <div class="flex items-center gap-1">
                  <span class="i-ph-calendar"></span>
                  <span>Due: {{ formatDate(todo.due_date) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="i-ph-clock"></span>
                  <span>{{ getStatusLabel(todo.status) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-2">
        <UButton
          @click="handlePageChange(pagination.page - 1)"
          :disabled="!pagination.hasPrev"
          btn="soft-gray"
          size="sm"
        >
          <span class="i-ph-caret-left"></span>
        </UButton>
        <span class="text-sm text-gray-600">
          Page {{ pagination.page }} of {{ pagination.totalPages }}
        </span>
        <UButton
          @click="handlePageChange(pagination.page + 1)"
          :disabled="!pagination.hasNext"
          btn="soft-gray"
          size="sm"
        >
          <span class="i-ph-caret-right"></span>
        </UButton>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <UDialog v-model:open="isDialogOpen">
      <div class="p-6">
        <h2 class="text-2xl font-700 text-gray-900 dark:text-white mb-4">
          {{ editingTodo ? 'Edit Task' : 'Create New Task' }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-600 text-gray-700 mb-2">Title *</label>
            <UInput
              v-model="formData.title"
              placeholder="Enter task title"
              size="lg"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-sm font-600 text-gray-700 mb-2">Description</label>
            <UTextarea
              v-model="formData.description"
              placeholder="Enter task description (optional)"
              rows="3"
              class="w-full"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-600 text-gray-700 mb-2">Due Date *</label>
              <UInput
                v-model="formData.due_date"
                type="date"
                size="lg"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-600 text-gray-700 mb-2">Priority</label>
              <USelect
                v-model="formData.priority"
                :items="priorityOptions"
                size="lg"
                class="w-full"
              />
            </div>
          </div>

          <div v-if="editingTodo">
            <label class="block text-sm font-600 text-gray-700 mb-2">Status</label>
            <USelect
              v-model="formData.status"
              :items="statusOptions"
              size="lg"
              class="w-full"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 mt-6">
          <UButton @click="closeDialog" btn="soft-gray" size="lg">
            Cancel
          </UButton>
          <UButton
            @click="saveTodo"
            btn="solid-black"
            size="lg"
            :loading="isSaving"
          >
            {{ editingTodo ? 'Update' : 'Create' }}
          </UButton>
        </div>
      </div>
    </UDialog>

    <!-- Delete Confirmation Dialog -->
    <UDialog v-model:open="isDeleteDialogOpen">
      <div class="p-6">
          <h2 class="text-2xl font-700 text-gray-900 dark:text-white mb-4">Delete Task</h2>
        <p class="text-gray-600 mb-6">
          Are you sure you want to delete "{{ deletingTodo?.title }}"? This action cannot be undone.
        </p>
        <div class="flex items-center justify-end gap-3">
          <UButton @click="closeDeleteDialog" btn="soft-gray" size="lg">
            Cancel
          </UButton>
          <UButton
            @click="confirmDelete"
            btn="solid-error"
            size="lg"
            :loading="isDeleting"
          >
            Delete
          </UButton>
        </div>
      </div>
    </UDialog>
  </div>
</template>

<script lang="ts" setup>
import type { Todo, TodoFormData } from '~/types/todo'
import type { Pagination } from '~/types/pagination'

const { loggedIn, user } = useUserSession()
const { toast } = useToast()

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

// State
const todos = ref<Todo[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const selectedStatus = ref('')
const selectedPriority = ref('')

// Pagination
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
})

// Dialog state
const isDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const editingTodo = ref<Todo | null>(null)
const deletingTodo = ref<Todo | null>(null)

// Form data
const formData = ref<TodoFormData>({
  title: '',
  description: '',
  due_date: '',
  status: 'pending',
  priority: 'medium',
})

// Filters
const statusFilters = [
  { value: 'pending', label: 'Pending', icon: 'i-ph-clock' },
  { value: 'in_progress', label: 'In Progress', icon: 'i-ph-spinner' },
  { value: 'completed', label: 'Completed', icon: 'i-ph-check-circle' }
]

const priorityFilters = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
]

const priorityOptions: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']

const statusOptions: Array<'pending' | 'in_progress' | 'completed'> = ['pending', 'in_progress', 'completed']

// Fetch todos
const fetchTodos = async () => {
  if (!loggedIn.value || user.value?.role !== 'admin') return

  isLoading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }

    if (selectedStatus.value) params.status = selectedStatus.value
    if (selectedPriority.value) params.priority = selectedPriority.value

    const response = await $fetch('/api/admin/todos', { params })

    if (response.success) {
      todos.value = response.data.todos
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('Error fetching todos:', error)
    toast({
      title: 'Error',
      description: 'Failed to fetch todos',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isLoading.value = false
  }
}

// Watch filters
watch([selectedStatus, selectedPriority], () => {
  pagination.value.page = 1
  fetchTodos()
})

// Dialog functions
const openCreateDialog = () => {
  editingTodo.value = null
  formData.value = {
    title: '',
    description: '',
    due_date: '',
    status: 'pending',
    priority: 'medium'
  }
  isDialogOpen.value = true
}

const openEditDialog = (todo: Todo) => {
  editingTodo.value = todo
  formData.value = {
    title: todo.title,
    description: todo.description,
    due_date: todo.due_date,
    status: todo.status,
    priority: todo.priority
  }
  isDialogOpen.value = true
}

const closeDialog = () => {
  isDialogOpen.value = false
  editingTodo.value = null
}

const openDeleteDialog = (todo: Todo) => {
  deletingTodo.value = todo
  isDeleteDialogOpen.value = true
}

const closeDeleteDialog = () => {
  isDeleteDialogOpen.value = false
  deletingTodo.value = null
}

// CRUD operations
const saveTodo = async () => {
  if (!formData.value.title || !formData.value.due_date) {
    toast({
      title: 'Error',
      description: 'Please fill in all required fields',
      toast: 'soft-error',
      duration: 5000
    })
    return
  }

  isSaving.value = true
  try {
    if (editingTodo.value) {
      // Update
      await $fetch(`/api/admin/todos/${editingTodo.value.id}`, {
        method: 'PATCH',
        body: formData.value
      })
      toast({
        title: 'Success',
        description: 'Task updated successfully',
        toast: 'soft-success',
        duration: 5000
      })
    } else {
      // Create
      await $fetch('/api/admin/todos', {
        method: 'POST',
        body: formData.value
      })
      toast({
        title: 'Success',
        description: 'Task created successfully',
        toast: 'soft-success',
        duration: 5000
      })
    }

    closeDialog()
    fetchTodos()
  } catch (error) {
    console.error('Error saving todo:', error)
    toast({
      title: 'Error',
      description: 'Failed to save task',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = async () => {
  if (!deletingTodo.value) return

  isDeleting.value = true
  try {
    await $fetch(`/api/admin/todos/${deletingTodo.value.id}`, {
      method: 'DELETE'
    })

    toast({
      title: 'Success',
      description: 'Task deleted successfully',
      toast: 'soft-success',
      duration: 5000
    })

    closeDeleteDialog()
    fetchTodos()
  } catch (error) {
    console.error('Error deleting todo:', error)
    toast({
      title: 'Error',
      description: 'Failed to delete task',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isDeleting.value = false
  }
}

const toggleTodoStatus = async (todo: Todo) => {
  const newStatus = todo.status === 'completed' ? 'pending' : 'completed'

  try {
    await $fetch(`/api/admin/todos/${todo.id}`, {
      method: 'PATCH',
      body: { status: newStatus }
    })

    fetchTodos()
  } catch (error) {
    console.error('Error updating todo status:', error)
    toast({
      title: 'Error',
      description: 'Failed to update task status',
      toast: 'soft-error',
      duration: 5000
    })
  }
}

// Pagination
const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchTodos()
}

// Helpers
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed'
  }
  return labels[status] || status
}

const getPriorityClass = (priority: string) => {
  const classes: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700'
  }
  return classes[priority] || 'bg-gray-100 text-gray-700'
}

// Initialize
onMounted(() => {
  fetchTodos()
})
</script>

