<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 font-classic">To-Do List</h1>
        <p class="text-sm text-stone-500 dark:text-zinc-400 mt-0.5">Manage art projects and upcoming tasks</p>
      </div>
      <div class="flex items-center gap-2">
        <!-- View toggle -->
        <div class="flex items-center bg-stone-100 dark:bg-zinc-800 rounded-lg p-0.5 gap-0.5">
          <button
            class="w-7 h-7 rounded-md flex items-center justify-center text-sm transition-colors"
            :class="viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-xs' : 'text-stone-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'"
            @click="viewMode = 'list'"
            title="List view"
          >
            <span class="i-ph-list-bullets"></span>
          </button>
          <button
            class="w-7 h-7 rounded-md flex items-center justify-center text-sm transition-colors"
            :class="viewMode === 'kanban' ? 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-xs' : 'text-stone-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'"
            @click="viewMode = 'kanban'"
            title="Kanban view"
          >
            <span class="i-ph-columns"></span>
          </button>
        </div>

        <button
          class="px-4 h-9 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1.5"
          @click="openCreateDialog"
        >
          <span class="i-ph-plus text-sm"></span>
          New Task
        </button>
      </div>
    </div>

    <!-- Filters (list view only) -->
    <div v-if="viewMode === 'list'" class="flex flex-wrap gap-2">
      <button
        v-for="sf in statusFilters"
        :key="sf.value"
        class="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium transition-colors"
        :class="selectedStatus === sf.value
          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
          : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'"
        @click="selectedStatus = selectedStatus === sf.value ? '' : sf.value"
      >
        <span :class="sf.icon" class="text-xs"></span>
        {{ sf.label }}
      </button>

      <div class="ml-auto flex gap-2">
        <button
          v-for="pf in priorityFilters"
          :key="pf.value"
          class="px-3 h-8 rounded-lg text-xs font-medium transition-colors"
          :class="selectedPriority === pf.value
            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
            : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'"
          @click="selectedPriority = selectedPriority === pf.value ? '' : pf.value"
        >
          {{ pf.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-3">
      <div v-for="n in 4" :key="n" class="h-24 rounded-xl bg-stone-100 dark:bg-zinc-800 animate-pulse"></div>
    </div>

    <!-- Kanban view -->
    <AdminKanbanBoard
      v-else-if="viewMode === 'kanban'"
      :columns="kanbanColumns"
      :on-add="(col) => { openCreateDialogForStatus(col) }"
      @item-click="openEditDialog"
      @edit="openEditDialog"
      @delete="openDeleteDialog"
    />

    <!-- List view empty -->
    <div
      v-else-if="todos.length === 0"
      class="admin-card p-12 flex flex-col items-center text-center"
    >
      <span class="i-ph-check-square text-3xl text-stone-300 dark:text-zinc-600 mb-3"></span>
      <h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">No tasks found</h3>
      <p class="text-xs text-stone-400 dark:text-zinc-500 mb-4">Create your first task to get started</p>
      <button
        class="px-4 h-8 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1.5"
        @click="openCreateDialog"
      >
        <span class="i-ph-plus text-xs"></span>
        Create Task
      </button>
    </div>

    <!-- List view -->
    <div v-else-if="viewMode === 'list'" class="space-y-2">
      <div
        v-for="todo in todos"
        :key="todo.id"
        class="admin-card p-4 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-start gap-3">
          <!-- Status toggle -->
          <button
            class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors"
            :class="todo.status === 'completed'
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-stone-300 dark:border-zinc-600 hover:border-amber-400'"
            @click="toggleTodoStatus(todo)"
          >
            <span v-if="todo.status === 'completed'" class="i-ph-check text-xs"></span>
          </button>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3 mb-1">
              <h3
                class="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                :class="{ 'line-through text-stone-400 dark:text-zinc-600': todo.status === 'completed' }"
              >
                {{ todo.title }}
              </h3>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <span class="admin-badge text-[10px] py-0.5" :class="priorityBadgeClass(todo.priority)">
                  {{ todo.priority }}
                </span>
                <button
                  class="w-6 h-6 flex items-center justify-center rounded text-stone-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                  @click="openEditDialog(todo)"
                >
                  <span class="i-ph-pencil-simple text-xs"></span>
                </button>
                <button
                  class="w-6 h-6 flex items-center justify-center rounded text-stone-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                  @click="openDeleteDialog(todo)"
                >
                  <span class="i-ph-trash-simple text-xs"></span>
                </button>
              </div>
            </div>

            <p v-if="todo.description" class="text-xs text-stone-500 dark:text-zinc-400 mb-2">{{ todo.description }}</p>

            <div class="flex items-center gap-3 text-[11px] text-stone-400 dark:text-zinc-500">
              <div class="flex items-center gap-1">
                <span class="i-ph-calendar-dots"></span>
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

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-2 pt-2">
        <button
          class="px-3 h-8 rounded-lg text-xs font-medium bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          :disabled="!pagination.hasPrev"
          @click="handlePageChange(pagination.page - 1)"
        >
          <span class="i-ph-caret-left"></span>
        </button>
        <span class="text-xs text-stone-500 dark:text-zinc-400">Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
        <button
          class="px-3 h-8 rounded-lg text-xs font-medium bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          :disabled="!pagination.hasNext"
          @click="handlePageChange(pagination.page + 1)"
        >
          <span class="i-ph-caret-right"></span>
        </button>
      </div>
    </div>

    <!-- Create / Edit Dialog -->
    <NDialog v-model:open="isDialogOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {{ editingTodo ? 'Edit Task' : 'New Task' }}
          </h3>

          <div class="space-y-1">
            <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Title *</label>
            <input v-model="formData.title" type="text" placeholder="Task title"
              class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Description</label>
            <textarea v-model="formData.description" placeholder="Optional description" rows="3"
              class="w-full px-3 py-2 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition resize-none"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Due Date *</label>
              <input v-model="formData.due_date" type="date"
                class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Priority</label>
              <select v-model="formData.priority"
                class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition">
                <option v-for="p in priorityOptions" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
          </div>

          <div v-if="editingTodo" class="space-y-1">
            <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Status</label>
            <select v-model="formData.status"
              class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/40 transition">
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
              @click="closeDialog"
            >Cancel</button>
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
              :disabled="!formData.title || !formData.due_date || isSaving"
              @click="saveTodo"
            >
              <span v-if="isSaving" class="i-ph-spinner-gap animate-spin mr-1.5 inline-block"></span>
              {{ editingTodo ? 'Save Changes' : 'Create Task' }}
            </button>
          </div>
        </div>
      </template>
    </NDialog>

    <!-- Delete Dialog -->
    <NDialog v-model:open="isDeleteDialogOpen">
      <template #content>
        <div class="p-6">
          <div class="flex items-start gap-4 mb-6">
            <div class="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
              <span class="i-ph-warning text-rose-600 dark:text-rose-400 text-xl"></span>
            </div>
            <div>
              <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Delete Task</h3>
              <p class="text-sm text-stone-500 dark:text-zinc-400">
                Delete <strong class="text-zinc-700 dark:text-zinc-300">{{ deletingTodo?.title }}</strong>? This cannot be undone.
              </p>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
              @click="closeDeleteDialog"
            >Cancel</button>
            <button
              class="px-4 h-9 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-60"
              :disabled="isDeleting"
              @click="confirmDelete"
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
import type { KanbanItem, KanbanColumn } from '~/components/admin/AdminKanbanBoard.vue'
import type { Todo, TodoFormData } from '~~/shared/types/todo'
import type { Pagination } from '~~/shared/types/pagination'

const { toast } = useToast()

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

// View state
const viewMode = ref<'list' | 'kanban'>('list')

// State
const todos = ref<Todo[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const selectedStatus = ref('')
const selectedPriority = ref('')

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

// Kanban columns
const kanbanColumns = computed<KanbanColumn[]>(() => [
  {
    id: 'pending',
    label: 'Pending',
    dotColor: 'bg-stone-400 dark:bg-zinc-500',
    items: todos.value
      .filter(t => t.status === 'pending')
      .map(t => toKanbanItem(t))
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    dotColor: 'bg-amber-400',
    items: todos.value
      .filter(t => t.status === 'in_progress')
      .map(t => toKanbanItem(t))
  },
  {
    id: 'completed',
    label: 'Completed',
    dotColor: 'bg-emerald-500',
    items: todos.value
      .filter(t => t.status === 'completed')
      .map(t => toKanbanItem(t))
  }
])

const toKanbanItem = (todo: Todo): KanbanItem => ({
  id: todo.id,
  title: todo.title,
  description: todo.description,
  priority: todo.priority,
  status: todo.status,
  dueDate: todo.due_date,
  _raw: todo
})

// Fetch
const fetchTodos = async () => {
  isLoading.value = true
  try {
    const params: any = { page: pagination.value.page, limit: pagination.value.limit }
    if (selectedStatus.value) params.status = selectedStatus.value
    if (selectedPriority.value) params.priority = selectedPriority.value

    const response = await $fetch('/api/admin/todos', { params }) as any
    if (response.success) {
      todos.value = response.data.todos
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('Error fetching todos:', error)
    toast({ title: 'Error', description: 'Failed to fetch todos', toast: 'soft-error', duration: 5000 })
  } finally {
    isLoading.value = false
  }
}

watch([selectedStatus, selectedPriority], () => {
  pagination.value.page = 1
  fetchTodos()
})

// Dialogs
const openCreateDialog = () => {
  editingTodo.value = null
  formData.value = { title: '', description: '', due_date: '', status: 'pending', priority: 'medium' }
  isDialogOpen.value = true
}

const openCreateDialogForStatus = (statusId: string) => {
  editingTodo.value = null
  formData.value = { title: '', description: '', due_date: '', status: statusId as any, priority: 'medium' }
  isDialogOpen.value = true
}

const openEditDialog = (todoOrItem: Todo | KanbanItem) => {
  const todo = '_raw' in todoOrItem ? todoOrItem._raw as Todo : todoOrItem as Todo
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

const openDeleteDialog = (todoOrItem: Todo | KanbanItem) => {
  deletingTodo.value = '_raw' in todoOrItem ? todoOrItem._raw as Todo : todoOrItem as Todo
  isDeleteDialogOpen.value = true
}

const closeDeleteDialog = () => {
  isDeleteDialogOpen.value = false
  deletingTodo.value = null
}

// CRUD
const saveTodo = async () => {
  if (!formData.value.title || !formData.value.due_date) {
    toast({ title: 'Error', description: 'Title and due date are required.', toast: 'soft-error', duration: 4000 })
    return
  }
  isSaving.value = true
  try {
    if (editingTodo.value) {
      await $fetch(`/api/admin/todos/${editingTodo.value.id}`, { method: 'PATCH', body: formData.value })
      toast({ title: 'Updated', description: 'Task updated.', toast: 'soft-success', duration: 4000 })
    } else {
      await $fetch('/api/admin/todos', { method: 'POST', body: formData.value })
      toast({ title: 'Created', description: 'Task created.', toast: 'soft-success', duration: 4000 })
    }
    closeDialog()
    fetchTodos()
  } catch (error) {
    console.error('Error saving todo:', error)
    toast({ title: 'Error', description: 'Failed to save task.', toast: 'soft-error', duration: 5000 })
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = async () => {
  if (!deletingTodo.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/todos/${deletingTodo.value.id}`, { method: 'DELETE' })
    toast({ title: 'Deleted', description: 'Task deleted.', toast: 'soft-success', duration: 4000 })
    closeDeleteDialog()
    fetchTodos()
  } catch (error) {
    console.error('Error deleting todo:', error)
    toast({ title: 'Error', description: 'Failed to delete task.', toast: 'soft-error', duration: 5000 })
  } finally {
    isDeleting.value = false
  }
}

const toggleTodoStatus = async (todo: Todo) => {
  const newStatus = todo.status === 'completed' ? 'pending' : 'completed'
  try {
    await $fetch(`/api/admin/todos/${todo.id}`, { method: 'PATCH', body: { status: newStatus } })
    fetchTodos()
  } catch (error) {
    console.error('Error updating todo status:', error)
    toast({ title: 'Error', description: 'Failed to update status.', toast: 'soft-error', duration: 5000 })
  }
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchTodos()
}

// Helpers
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed'
  }
  return labels[status] || status
}

const priorityBadgeClass = (priority: string) => {
  if (priority === 'high') return 'admin-badge-rose'
  if (priority === 'medium') return 'admin-badge-amber'
  return 'admin-badge-cyan'
}

onMounted(() => fetchTodos())
</script>
