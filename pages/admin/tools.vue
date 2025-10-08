<template>
  <div>
    <!-- Access Control -->
    <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
      <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Access Denied</h2>
      <p class="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
      <UButton to="/user" class="mt-4">Go to Profile</UButton>
    </div>

    <div v-else class="space-y-8">
      <div>
        <h1 class="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Admin Tools</h1>
        <p class="text-gray-600 dark:text-gray-400">Operations that affect stored data and files.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Thumbnails regeneration -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold mb-2">Regenerate thumbnails</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">Rebuild resized variants for one image or all images. Useful after updating processing or when a variant is missing.</p>
          <div class="flex gap-3 items-end">
            <UInput v-model.number="imageId" type="number" placeholder="Image ID (optional)" class="w-48" />
            <UButton :loading="regenLoading" btn="soft-blue" @click="regenerate">
              <span class="i-ph-arrows-clockwise mr-2"></span>
              <span>{{ imageId ? 'Regenerate image' : 'Regenerate all (batch)' }}</span>
            </UButton>
          </div>
          <p v-if="regenResult" class="text-xs text-gray-500 mt-3">{{ regenResult }}</p>
        </div>

        <!-- Import / Export -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold mb-2">Data import / export</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-3">Export entities to JSON or import from a JSON file.</p>
          <div class="flex flex-wrap gap-3 items-center">
            <UButton :loading="exporting" btn="soft-gray" @click="exportAll">
              <span class="i-ph-cloud-arrow-down mr-2" /> Export JSON
            </UButton>
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <UButton btn="soft-purple">
                <span class="i-ph-cloud-arrow-up mr-2" /> Import JSON
              </UButton>
              <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="importJson">
            </label>
          </div>
          <p v-if="importResult" class="text-xs text-gray-500 mt-3">{{ importResult }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { loggedIn, user } = useUserSession()
const { toast } = useToast()

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const imageId = ref<number | null>(null)
const regenLoading = ref(false)
const regenResult = ref('')

async function regenerate() {
  regenLoading.value = true
  regenResult.value = ''
  try {
    if (imageId.value) {
  const res: any = await $fetch(`/api/admin/images/${imageId.value}/regenerate`, { method: 'POST' as any })
  regenResult.value = res?.success ? 'Regenerated successfully.' : 'Failed to regenerate.'
    } else {
  const res: any = await $fetch('/api/admin/images/regenerate', { method: 'POST' as any })
  regenResult.value = res?.success ? `Batch processed: ${res.processed}/${res.total}` : 'Failed to start batch.'
    }
    toast({ title: 'Thumbnails', description: regenResult.value, toast: 'soft-success' })
  } catch (e) {
    toast({ title: 'Thumbnails', description: 'Operation failed', toast: 'soft-error' })
  } finally {
    regenLoading.value = false
  }
}

const exporting = ref(false)
const importResult = ref('')
const fileInput = ref<HTMLInputElement>()

async function exportAll() {
  exporting.value = true
  try {
    const blob = await $fetch<Blob>('/api/admin/export', { responseType: 'blob' as any })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zimablue-export-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}

async function importJson(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const fd = new FormData()
    fd.append('file', file)
  const res: any = await $fetch('/api/admin/import', { method: 'POST' as any, body: fd })
  importResult.value = `Imported ${res?.counts?.images ?? 0} images, ${res?.counts?.collections ?? 0} collections, ${res?.counts?.tags ?? 0} tags.`
    toast({ title: 'Import completed', description: importResult.value, toast: 'soft-success' })
    if (fileInput.value) fileInput.value.value = ''
  } catch (e) {
    toast({ title: 'Import failed', description: 'Please check your JSON file.', toast: 'soft-error' })
  }
}
</script>
