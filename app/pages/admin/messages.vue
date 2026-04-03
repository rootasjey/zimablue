<template>
  <div class="space-y-6">
    <section class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
      <div class="admin-card overflow-hidden border-none bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,245,244,0.94))] p-5 shadow-sm dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.98),rgba(17,24,39,0.94))] sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.22em] text-stone-400 dark:text-zinc-500">Inbox pulse</p>
            <h2 class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Messages that need a response</h2>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-stone-500 dark:text-zinc-400">
              Review new contact requests, clear your unread queue, and batch process routine actions without losing context.
            </p>
          </div>

          <div class="grid grid-cols-3 gap-3 sm:min-w-[320px]">
            <div class="rounded-2xl border border-stone-200 bg-white/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/70">
              <p class="text-[11px] uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Unread</p>
              <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ unreadCount }}</p>
            </div>
            <div class="rounded-2xl border border-stone-200 bg-white/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/70">
              <p class="text-[11px] uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Selected</p>
              <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ selectedCount }}</p>
            </div>
            <div class="rounded-2xl border border-stone-200 bg-white/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/70">
              <p class="text-[11px] uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500">Total</p>
              <p class="mt-2 font-classic text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{{ pagination.total }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-card p-5 sm:p-6">
        <p class="text-xs font-medium uppercase tracking-[0.22em] text-stone-400 dark:text-zinc-500">Workflow</p>
        <div class="mt-4 space-y-3">
          <div class="rounded-2xl bg-stone-50 p-4 dark:bg-zinc-900/80">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <span class="i-ph-envelope-open text-lg"></span>
              </div>
              <div>
                <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Open the latest unread message first</p>
                <p class="text-xs text-stone-500 dark:text-zinc-400">The list keeps unread items visually distinct.</p>
              </div>
            </div>
          </div>
          <div class="rounded-2xl bg-stone-50 p-4 dark:bg-zinc-900/80">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                <span class="i-ph-selection-plus text-lg"></span>
              </div>
              <div>
                <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Use multi-select for cleanup</p>
                <p class="text-xs text-stone-500 dark:text-zinc-400">Batch mark, archive mentally, then delete only what is safe.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <AdminMessageHeader
      :total-messages="pagination.total"
      :visible-messages="messages.length"
      :unread-count="unreadCount"
      :selected-count="selectedCount"
      :is-loading="isLoading"
      :multi-select-active="multiSelectActive"
      @refresh="fetchMessages"
      @bulk-action="handleBulkAction"
      @search="handleSearch"
      @filter-change="handleFilterChange"
      @select-all="toggleSelectAll"
      @toggle-multiselect="toggleMultiSelect"
    />

    <section class="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
      <AdminMessageList
        :messages="messages"
        :selected-messages="selectedMessages"
        :is-loading="isLoading"
        :multi-select-active="multiSelectActive"
        :active-message-id="selectedMessage ? selectedMessage.id : undefined"
        @select-message="toggleMessageSelection"
        @view-message="viewMessage"
      />

      <div class="hidden xl:block">
        <AdminMessageDetail
          v-if="selectedMessage"
          :message="selectedMessage"
          @mark-read="markAsRead"
          @delete="showDeleteDialog"
          @close="closeDetail"
        />

        <div v-else class="admin-card flex min-h-[520px] items-center justify-center p-10 text-center">
          <div>
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-stone-100 text-stone-400 dark:bg-zinc-800 dark:text-zinc-500">
              <span class="i-ph-chat-circle-text text-3xl"></span>
            </div>
            <h3 class="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">Select a message</h3>
            <p class="mt-2 text-sm text-stone-500 dark:text-zinc-400">
              The conversation body, sender details, and actions appear here.
            </p>
          </div>
        </div>
      </div>
    </section>

    <AdminMessagePagination
      v-if="pagination.totalPages > 1"
      :pagination="pagination"
      @page-change="handlePageChange"
    />

    <!-- Mobile drawer for message details -->
    <NDrawer v-model:open="isDrawerOpen">
      <NDrawerContent class="w-full max-w-[95vw] bottom-0">
        <NDrawerHeader>
          <NDrawerTitle>Message Details</NDrawerTitle>
          <NDrawerDescription class="text-sm text-stone-500 dark:text-zinc-400">Details and actions</NDrawerDescription>
        </NDrawerHeader>

        <div class="p-4">
          <AdminMessageDetail
            v-if="selectedMessage"
            :message="selectedMessage"
            @mark-read="markAsRead"
            @delete="showDeleteDialog"
            @close="closeDrawer"
          />
        </div>

        <NDrawerFooter />
      </NDrawerContent>
    </NDrawer>

    <AdminMessageDeleteDialog
      v-if="selectedMessage"
      :message-id="selectedMessage.id"
      :is-open="isDeleteDialogOpen"
      :subject="selectedMessage.subject"
      @confirm="deleteMessage"
      @close="closeDeleteDialog"
    />

    <AdminMessageDeleteBulkDialog
      :is-open="isDeleteBulkDialogOpen"
      :count="Object.values(selectedMessages).filter(Boolean).length"
      @confirm="() => handleBulkAction('delete')"
      @close="isDeleteBulkDialogOpen = false"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Message } from '~~/shared/types/message'
import type { Pagination } from '~~/shared/types/pagination'
import AdminMessageDetail from '~/components/adminMessage/AdminMessageDetail.vue'

const { toast } = useToast()
const fetchAdmin = $fetch as (url: string, options?: Record<string, any>) => Promise<any>

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const messages = ref<Message[]>([])
const selectedMessages = ref<Record<number, boolean>>({})
const selectedMessage = ref<Message | null>(null)
const isModalOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isDeleteBulkDialogOpen = ref(false)
const isDrawerOpen = ref(false)
const isLoading = ref(false)
const unreadCount = ref(0)
const multiSelectActive = ref(false)
const selectedCount = computed(() => Object.values(selectedMessages.value).filter(Boolean).length)

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
  read: undefined as boolean | undefined
})

const fetchUnreadCount = async () => {
  const response = await fetchAdmin('/api/admin/messages?limit=1&read=false')
  if (response?.success) {
    unreadCount.value = response.data?.pagination?.total ?? 0
  }
}

const fetchMessages = async () => {
  isLoading.value = true
  
  try {
    const query = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    })

    if (filters.value.search) {
      query.append('search', filters.value.search)
    }

    if (filters.value.read !== undefined) {
      query.append('read', filters.value.read.toString())
    }

    const response = await fetchAdmin(`/api/admin/messages?${query.toString()}`)
    
    if (response.success) {
      messages.value = response.data.messages
      pagination.value = response.data.pagination
      selectedMessages.value = {}

      if (!selectedMessage.value && messages.value.length > 0) {
        selectedMessage.value = messages.value[0] ?? null
      } else if (selectedMessage.value) {
        selectedMessage.value = messages.value.find(m => m.id === selectedMessage.value?.id) ?? null
      }

      await fetchUnreadCount()
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    toast({
      title: 'Error',
      description: 'Failed to fetch messages. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isLoading.value = false
  }
}

const toggleMessageSelection = (messageId: number) => {
  if (selectedMessages.value[messageId]) {
    delete selectedMessages.value[messageId]
    return
  }

  selectedMessages.value[messageId] = true
}

const toggleSelectAll = () => {
  const selectedTrue = Object.values(selectedMessages.value).filter(Boolean).length
  const allSelected = selectedTrue === messages.value.length
  if (allSelected) {
    selectedMessages.value = {}
    return
  }

  selectedMessages.value = messages.value.reduce((acc, message) => {
    acc[message.id] = true
    return acc
  }, {} as Record<number, boolean>)
}

const markAsRead = async (messageId: number, read: boolean = true) => {
  try {
    const response = await fetchAdmin(`/api/admin/messages/${messageId}`, {
      method: 'PATCH',
      body: { read }
    })

    if (response.success) {
      // Update local state
      const messageIndex = messages.value.findIndex(m => m.id === messageId)
      if (messageIndex > -1) {
        messages.value[messageIndex] = response.data
      }

      // Update selected message if it's open
      if (selectedMessage.value?.id === messageId) {
        selectedMessage.value = response.data
      }

      await fetchUnreadCount()

      toast({
        title: 'Success',
        description: `Message marked as ${read ? 'read' : 'unread'}`,
        toast: 'soft-success',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('Error updating message:', error)
    toast({
      title: 'Error',
      description: 'Failed to update message. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  }
}

const deleteMessage = async (messageId: number) => {
  try {
    const response = await fetchAdmin(`/api/admin/messages/${messageId}`, {
      method: 'DELETE'
    })

    if (response.success) {
      // Remove from local state
      messages.value = messages.value.filter(m => m.id !== messageId)
      delete selectedMessages.value[messageId]
      
      // Close modal if this message was open
      if (selectedMessage.value?.id === messageId) {
        closeModal()
        closeDeleteDialog()
      }

      // Update pagination total
      pagination.value.total--
      await fetchUnreadCount()

      toast({
        title: 'Success',
        description: 'Message deleted successfully',
        toast: 'soft-success',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('Error deleting message:', error)
    toast({
      title: 'Error',
      description: 'Failed to delete message. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  }
}

const handleBulkAction = async (action: 'mark_read' | 'mark_unread' | 'confirm_delete' | 'delete') => {
  const selectedTrueMap = Object.entries(selectedMessages.value)
    .filter(([, val]) => val === true)
    .map(([key]) => key)

  if (selectedTrueMap.length === 0) return

  if (action === 'confirm_delete') {
    isDeleteBulkDialogOpen.value = true
    return
  }

  if (action === 'delete') {
    isDeleteBulkDialogOpen.value = false
  }

  try {
    const response = await fetchAdmin('/api/admin/messages/bulk', {
      method: 'POST',
      body: {
        action,
        messageIds: selectedTrueMap,
      }
    })

    if (response.success) {
      // Refresh messages list
      await fetchMessages()
      selectedMessages.value = {}

      toast({
        title: 'Success',
        description: `Successfully processed ${response.processedCount} messages`,
        toast: 'soft-success',
        duration: 3000
      })
    }
  } catch (error) {
    console.error('Error processing bulk action:', error)
    toast({
      title: 'Error',
      description: 'Failed to process bulk action. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  }
}

const handleSearch = (searchTerm: string) => {
  filters.value.search = searchTerm
  pagination.value.page = 1
  fetchMessages()
}

const handleFilterChange = (filterType: string, value: any) => {
  if (filterType === 'read') {
    filters.value.read = value
  }

  pagination.value.page = 1
  fetchMessages()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchMessages()
}

const toggleMultiSelect = () => {
  multiSelectActive.value = !multiSelectActive.value
  if (!multiSelectActive.value) {
    selectedMessages.value = {}
  }
}

const viewMessage = (message: Message) => {
  selectedMessage.value = message
  if (window.innerWidth < 1280) {
    isDrawerOpen.value = true
  }

  if (!message.read) {
    markAsRead(message.id, true)
  }
}

const closeModal = () => {
  selectedMessage.value = null
  isModalOpen.value = false
}

const closeDetail = () => {
  // Used by inline detail close button to clear selection
  selectedMessage.value = null
}

const closeDrawer = () => {
  isDrawerOpen.value = false
}

const showDeleteDialog = (message: Message) => {
  selectedMessage.value = message
  isDeleteDialogOpen.value = true
}

const closeDeleteDialog = () => {
  isDeleteDialogOpen.value = false
}

onMounted(() => fetchMessages())
</script>

