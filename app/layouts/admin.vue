<template>
  <div class="admin-surface min-h-screen">
    <div class="flex min-h-screen flex-col">
      <AdminTopBar
        :unread-count="unreadCount"
        @open-notifications="goToMessages"
        @open-command-dialog="openCommandDialog"
      />

      <main class="flex-1 overflow-y-auto">
        <div class="mx-auto max-w-screen-2xl p-5 pb-18 md:p-7 md:pb-20">
          <slot />
        </div>
      </main>
    </div>

    <AdminCommandDialog
      v-model:open="isCommandDialogOpen"
      :unread-count="unreadCount"
      @upload-images="handleUploadImages"
      @create-collection="openCollectionCreateDialog"
    />

    <CollectionCreateDialog
      v-model:open="collectionStore.isCreateDialogOpen"
      :form-data="collectionStore.newCollection"
      @create="handleCreateCollection"
      @cancel="collectionStore.closeCreateDialog"
    />
  </div>
</template>

<script lang="ts" setup>
import { useImageUpload } from '~/composables/image/useImageUpload'

const router = useRouter()
const route = useRoute()
const fetchAdmin = $fetch as (url: string) => Promise<any>
const { toast } = useToast()
const imageUpload = useImageUpload()
const collectionStore = useCollectionStore()

// Global unread counter for Messages badge & topbar bell
const unreadCount = ref(0)
const isCommandDialogOpen = ref(false)

const fetchUnreadCount = async () => {
  try {
    const response = await fetchAdmin('/api/admin/messages?limit=1&read=false')
    if (response?.success && response?.data?.pagination?.total !== undefined) {
      unreadCount.value = response.data.pagination.total
    }
  } catch {
    // silent
  }
}

const goToMessages = () => router.push('/admin/messages')

const isEditableTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null
  if (!element) return false

  return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable
}

const openCommandDialog = () => {
  if (!route.path.startsWith('/admin')) {
    return
  }

  isCommandDialogOpen.value = true
}

const closeCommandDialog = () => {
  isCommandDialogOpen.value = false
}

const toggleCommandDialog = () => {
  if (isCommandDialogOpen.value) {
    closeCommandDialog()
    return
  }

  openCommandDialog()
}

const handleUploadImages = () => {
  imageUpload.triggerFileUpload()
}

const openCollectionCreateDialog = () => {
  collectionStore.resetNewCollectionForm()
  collectionStore.openCreateDialog()
}

const handleCreateCollection = async () => {
  const result = await collectionStore.createCollection()

  toast({
    title: result.success ? 'Success' : 'Error',
    description: result.message,
    toast: result.success ? 'soft-success' : 'soft-error',
    duration: result.success ? 3000 : 5000,
  })
}

const handleCommandKeydown = (event: KeyboardEvent) => {
  if (!route.path.startsWith('/admin')) {
    return
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !isEditableTarget(event.target)) {
    event.preventDefault()
    toggleCommandDialog()
    return
  }

  if (event.key === 'Escape' && isCommandDialogOpen.value) {
    closeCommandDialog()
  }
}

onMounted(fetchUnreadCount)
onMounted(() => {
  document.addEventListener('keydown', handleCommandKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleCommandKeydown)
})

watch(() => route.fullPath, fetchUnreadCount)
watch(() => route.path, () => {
  closeCommandDialog()
})
</script>
