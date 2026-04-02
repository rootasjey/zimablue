<template>
  <NDialog v-model:open="dialogOpen" :_dialog="{ class: 'max-w-[1120px]' }"
    :_dialog-content="{
      class: 'bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-6xl',
    }"
  >
    <template #content>
      <div class="flex max-h-[82vh] min-h-0 flex-col overflow-hidden p-5 sm:p-6">
        <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside class="flex h-full min-h-0 flex-col gap-4 overflow-hidden rounded-3xl border border-stone-200 bg-stone-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
            <div>
              <p class="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-zinc-500">Queue illustrations</p>
              <h3 class="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Add illustrations to social queue</h3>
              <p class="mt-1 text-sm leading-6 text-stone-500 dark:text-zinc-400">Drag cards between columns to build the queue. Selected order becomes the posting order.</p>
            </div>

            <div class="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-zinc-400">
              <span class="rounded-full bg-white px-2.5 py-1 dark:bg-zinc-800">{{ currentPlatformLabel }}</span>
              <span class="rounded-full bg-white px-2.5 py-1 dark:bg-zinc-800">{{ selectedCandidateIds.length }} selected</span>
              <span class="rounded-full bg-white px-2.5 py-1 dark:bg-zinc-800">{{ unselectedCandidateRows.length }} available</span>
            </div>

            <button
              type="button"
              class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              :disabled="isRandomAdding || isCandidatesLoading"
              @click="addRandomCandidates"
            >
              <span v-if="isRandomAdding" class="i-ph-spinner-gap animate-spin"></span>
              <span v-else class="i-ph-shuffle"></span>
              Add 15 random
            </button>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div class="space-y-1">
                <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Platform</label>
                <select v-model="selectedPlatform" class="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  <option v-for="platform in platformOptions" :key="platform.value" :value="platform.value">{{ platform.label }}</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Scheduled for</label>
                <input v-model="scheduledFor" type="datetime-local" class="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              </div>
            </div>

            <div class="mt-auto flex flex-col-reverse gap-2 pt-2 sm:flex-row lg:flex-col xl:flex-row">
              <button class="h-9 rounded-lg bg-stone-100 px-4 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700" @click="closeDialog">Cancel</button>
              <button class="h-9 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60" :disabled="isSubmitting || selectedCandidateIds.length === 0" @click="submitEnqueue">
                <span v-if="isSubmitting" class="mr-1.5 inline-block animate-spin i-ph-spinner-gap"></span>
                Add to queue
              </button>
            </div>
          </aside>

          <div class="grid min-h-0 h-full gap-4 lg:grid-cols-2">
            <section
              class="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-stone-200 bg-stone-50/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/40"
              @dragover.prevent="handleSelectedZoneDragOver"
              @drop.prevent="handleSelectedZoneDrop"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h4 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Selected</h4>
                  <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">These items will be queued in this order.</p>
                </div>
                <button
                  v-if="selectedCandidateRows.length"
                  type="button"
                  class="text-xs font-medium text-stone-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  @click="clearSelectedCandidates"
                >
                  Clear all
                </button>
              </div>

              <div v-if="selectedCandidateRows.length === 0" class="mt-4 flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white/70 px-4 py-8 text-center text-sm text-stone-500 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-400">
                Drop illustrations here or pick them from the available list.
              </div>

              <div v-else class="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 pb-1">
                <button
                  v-for="(candidate, index) in selectedCandidateRows"
                  :key="candidate.id"
                  type="button"
                  draggable="true"
                  class="group flex w-full items-center gap-3 rounded-2xl border border-blue-200 bg-white px-3 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/70 dark:border-blue-500/20 dark:bg-zinc-950/60 dark:hover:border-blue-400/30 dark:hover:bg-blue-500/10"
                  :class="selectedDropClass(candidate.id)"
                  @click="toggleCandidateSelection(candidate)"
                  @dragstart="handleDragStart(candidate, 'selected', $event)"
                  @dragend="handleDragEnd"
                  @dragover.prevent="handleSelectedItemDragOver(candidate.id, $event)"
                  @drop.prevent="handleSelectedItemDrop(candidate.id, $event)"
                >
                  <div class="flex h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-zinc-800">
                    <NuxtImg
                      provider="hubblob"
                      :src="candidateImageSrc(candidate.pathname)"
                      :alt="candidate.name"
                      class="h-full w-full object-cover"
                    />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-[11px] font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{{ index + 1 }}</span>
                      <p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ candidate.name }}</p>
                    </div>
                    <p class="truncate text-xs text-stone-500 dark:text-zinc-400">/{{ candidate.slug }}</p>
                    <p class="mt-1 text-[11px] text-stone-400 dark:text-zinc-500">{{ candidate.postCount }} previous post(s) · {{ candidate.userName || 'Unknown author' }}</p>
                  </div>

                  <span class="i-ph-x-circle text-base text-stone-400 transition-colors group-hover:text-rose-500"></span>
                </button>
              </div>
            </section>

            <section
              class="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950/50"
              :class="selectedPlatformDropZoneClass"
              @dragover.prevent="handleAvailableZoneDragOver"
              @drop.prevent="handleAvailableZoneDrop"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Available</h4>
                    <span class="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">{{ unselectedCandidateRows.length }}</span>
                  </div>
                  <p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">Search results are ordered by lowest post count first.</p>
                </div>
              </div>

              <div class="mt-4 space-y-2">
                <input
                  v-model="candidateSearchQuery"
                  type="search"
                  placeholder="Search available illustrations..."
                  class="h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <div class="text-xs text-stone-400 dark:text-zinc-500">
                  {{ candidateRows.length }} matching
                </div>
              </div>

              <div v-if="isCandidatesLoading" class="mt-4 flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-sm text-stone-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
                <span class="i-ph-spinner-gap mr-2 animate-spin"></span>
                Loading illustrations...
              </div>

              <div v-else-if="unselectedCandidateRows.length === 0" class="mt-4 flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
                <div>
                  <p class="font-medium text-zinc-700 dark:text-zinc-200">No matching illustrations</p>
                  <p class="mt-1 text-xs text-stone-400 dark:text-zinc-500">Try a broader search or add random low-count picks.</p>
                </div>
              </div>

              <div v-else class="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 pb-1">
                <button
                  v-for="candidate in unselectedCandidateRows"
                  :key="candidate.id"
                  type="button"
                  draggable="true"
                  class="group flex w-full items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/80 px-3 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/70 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-blue-400/30 dark:hover:bg-blue-500/10"
                  @click="toggleCandidateSelection(candidate)"
                  @dragstart="handleDragStart(candidate, 'available', $event)"
                  @dragend="handleDragEnd"
                >
                  <div class="flex h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-zinc-800">
                    <NuxtImg
                      provider="hubblob"
                      :src="candidateImageSrc(candidate.pathname)"
                      :alt="candidate.name"
                      class="h-full w-full object-cover"
                    />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ candidate.name }}</p>
                    </div>
                    <p class="truncate text-xs text-stone-500 dark:text-zinc-400">/{{ candidate.slug }}</p>
                    <p class="mt-1 text-[11px] text-stone-400 dark:text-zinc-500">{{ candidate.postCount }} previous post(s) · {{ candidate.w }} × {{ candidate.h }}</p>
                  </div>

                  <span class="i-ph-plus-circle text-base text-stone-400 transition-colors group-hover:text-blue-600"></span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </template>
  </NDialog>
</template>

<script lang="ts" setup>
type Platform = 'x' | 'bluesky' | 'instagram' | 'threads' | 'facebook'

interface PlatformOption {
  label: string
  value: Platform
  icon: string
}

interface SocialQueueCandidate {
  id: number
  name: string
  description: string
  pathname: string
  slug: string
  w: number
  h: number
  postCount: number
  userName: string | null
}

interface Props {
  open: boolean
  defaultPlatform: Platform
  platformOptions: PlatformOption[]
}

interface SubmittedPayload {
  platform: Platform
  imageIds: number[]
  count: number
}

type DragSource = 'available' | 'selected'

interface DragState {
  id: number
  source: DragSource
}

interface DropState {
  target: 'available' | 'selected'
  candidateId?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submitted: [payload: SubmittedPayload]
}>()

const dialogOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

const selectedPlatform = ref<Platform>(props.defaultPlatform)
const scheduledFor = ref('')
const candidateSearchQuery = ref('')
const candidateRows = ref<SocialQueueCandidate[]>([])
const selectedCandidateIds = ref<number[]>([])
const isCandidatesLoading = ref(false)
const isRandomAdding = ref(false)
const isSubmitting = ref(false)
const candidateCache = reactive<Record<number, SocialQueueCandidate>>({})
const draggedCandidate = ref<DragState | null>(null)
const dropState = ref<DropState | null>(null)
const isResettingDialog = ref(false)

const currentPlatformLabel = computed(() => props.platformOptions.find(option => option.value === selectedPlatform.value)?.label || selectedPlatform.value)
const selectedCandidateRows = computed(() => selectedCandidateIds.value
  .map(id => candidateCache[id])
  .filter((candidate): candidate is SocialQueueCandidate => Boolean(candidate)))
const unselectedCandidateRows = computed(() => candidateRows.value.filter(candidate => !selectedCandidateIds.value.includes(candidate.id)))
const selectedPlatformDropZoneClass = computed(() => draggedCandidate.value?.source === 'selected' && dropState.value?.target === 'available'
  ? 'ring-2 ring-dashed ring-blue-400/60 bg-blue-50/40 dark:bg-blue-500/10'
  : '')

const candidateImageSrc = (pathname: string) => pathname.startsWith('/') ? pathname : `/${pathname}`

const clearCandidateCache = () => {
  for (const key of Object.keys(candidateCache)) {
    delete candidateCache[Number(key)]
  }
}

const rememberCandidateRows = (rowsToRemember: SocialQueueCandidate[]) => {
  for (const row of rowsToRemember) {
    candidateCache[row.id] = row
  }
}

const resetDialogState = async () => {
  isResettingDialog.value = true
  selectedPlatform.value = props.defaultPlatform
  scheduledFor.value = ''
  candidateSearchQuery.value = ''
  candidateRows.value = []
  selectedCandidateIds.value = []
  clearCandidateCache()
  dropState.value = null
  draggedCandidate.value = null
  await loadCandidateRows({ search: '', updateVisible: true })
  isResettingDialog.value = false
}

const loadCandidateRows = async (options: { search?: string, limit?: number, updateVisible?: boolean } = {}) => {
  const search = options.search ?? candidateSearchQuery.value
  const limit = options.limit ?? 150
  const updateVisible = options.updateVisible ?? true

  isCandidatesLoading.value = updateVisible
  try {
    const response = await $fetch<{ success: boolean, data: SocialQueueCandidate[] }>('/api/admin/social-queue/candidates', {
      query: {
        platform: selectedPlatform.value,
        search: search || undefined,
        limit,
      }
    })

    if (response.success) {
      rememberCandidateRows(response.data)
      if (updateVisible) {
        candidateRows.value = response.data
      }
      return response.data
    }
  } catch (error) {
    console.error('Failed to fetch social queue candidates:', error)
    if (updateVisible) {
      toast({ title: 'Error', description: 'Failed to load illustrations for the queue picker.', toast: 'soft-error' })
    }
  } finally {
    if (updateVisible) {
      isCandidatesLoading.value = false
    }
  }

  return [] as SocialQueueCandidate[]
}

const refreshCandidateRows = useDebounceFn(() => {
  if (!dialogOpen.value) return
  void loadCandidateRows({ search: candidateSearchQuery.value, updateVisible: true })
}, 250)

const toggleCandidateSelection = (candidate: SocialQueueCandidate) => {
  rememberCandidateRows([candidate])
  if (selectedCandidateIds.value.includes(candidate.id)) {
    selectedCandidateIds.value = selectedCandidateIds.value.filter(id => id !== candidate.id)
    return
  }

  selectedCandidateIds.value = [...selectedCandidateIds.value, candidate.id]
}

const clearSelectedCandidates = () => {
  selectedCandidateIds.value = []
}

const pickPrioritizedRandomCandidates = (pool: SocialQueueCandidate[], count: number) => {
  const grouped = new Map<number, SocialQueueCandidate[]>()

  for (const candidate of pool) {
    const bucket = grouped.get(candidate.postCount) || []
    bucket.push(candidate)
    grouped.set(candidate.postCount, bucket)
  }

  const picked: SocialQueueCandidate[] = []
  const orderedCounts = [...grouped.keys()].sort((left, right) => left - right)

  for (const postCount of orderedCounts) {
    const bucket = [...(grouped.get(postCount) || [])].sort(() => Math.random() - 0.5)

    for (const candidate of bucket) {
      if (picked.length >= count) break
      picked.push(candidate)
    }

    if (picked.length >= count) break
  }

  return picked
}

const addRandomCandidates = async () => {
  isRandomAdding.value = true
  try {
    const pool = await loadCandidateRows({ search: '', limit: 1000, updateVisible: false })
    const available = pool.filter(candidate => !selectedCandidateIds.value.includes(candidate.id))
    const picked = pickPrioritizedRandomCandidates(available, 15)

    if (!picked.length) {
      toast({ title: 'Nothing to add', description: 'No additional illustrations were available for this platform.', toast: 'soft-warning' })
      return
    }

    rememberCandidateRows(picked)
    selectedCandidateIds.value = [...selectedCandidateIds.value, ...picked.map(candidate => candidate.id)]
    toast({ title: 'Added', description: `${picked.length} random illustration(s) added to the selection.`, toast: 'soft-success' })
  } finally {
    isRandomAdding.value = false
  }
}

const getSelectedIndex = (id: number) => selectedCandidateIds.value.findIndex(candidateId => candidateId === id)

const insertSelectedCandidateAt = (candidateId: number, targetIndex: number) => {
  const nextIds = [...selectedCandidateIds.value.filter(id => id !== candidateId)]
  const safeIndex = Math.max(0, Math.min(targetIndex, nextIds.length))
  nextIds.splice(safeIndex, 0, candidateId)
  selectedCandidateIds.value = nextIds
}

const appendSelectedCandidate = (candidateId: number) => {
  if (selectedCandidateIds.value[selectedCandidateIds.value.length - 1] === candidateId) return
  selectedCandidateIds.value = [...selectedCandidateIds.value.filter(id => id !== candidateId), candidateId]
}

const removeSelectedCandidate = (candidateId: number) => {
  selectedCandidateIds.value = selectedCandidateIds.value.filter(id => id !== candidateId)
}

const handleDragStart = (candidate: SocialQueueCandidate, source: DragSource, event: DragEvent) => {
  draggedCandidate.value = { id: candidate.id, source }
  dropState.value = null

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(candidate.id))
    const dragImage = event.currentTarget as HTMLElement | null
    if (dragImage) {
      event.dataTransfer.setDragImage(dragImage, Math.max(1, dragImage.offsetWidth / 2), Math.max(1, dragImage.offsetHeight / 2))
    }
  }
}

const handleDragEnd = () => {
  draggedCandidate.value = null
  dropState.value = null
}

const handleSelectedItemDragOver = (candidateId: number, event: DragEvent) => {
  if (!draggedCandidate.value) return
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  if (draggedCandidate.value.id === candidateId && draggedCandidate.value.source === 'selected') return
  dropState.value = { target: 'selected', candidateId }
}

const handleSelectedItemDrop = (candidateId: number, event: DragEvent) => {
  if (!draggedCandidate.value) return
  event.preventDefault()

  const targetIndex = getSelectedIndex(candidateId)
  if (targetIndex === -1) return

  if (draggedCandidate.value.source === 'selected') {
    const fromIndex = getSelectedIndex(draggedCandidate.value.id)
    if (fromIndex === -1 || draggedCandidate.value.id === candidateId) return
    const nextIds = [...selectedCandidateIds.value]
    const [moved] = nextIds.splice(fromIndex, 1)
    if (moved === undefined) return
    const adjustedTargetIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex
    nextIds.splice(adjustedTargetIndex, 0, moved)
    selectedCandidateIds.value = nextIds
  } else {
    insertSelectedCandidateAt(draggedCandidate.value.id, targetIndex)
  }

  dropState.value = null
}

const handleSelectedZoneDragOver = (event: DragEvent) => {
  if (!draggedCandidate.value) return
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dropState.value = { target: 'selected' }
}

const handleSelectedZoneDrop = (event: DragEvent) => {
  if (!draggedCandidate.value) return
  event.preventDefault()

  if (draggedCandidate.value.source === 'selected') {
    appendSelectedCandidate(draggedCandidate.value.id)
  } else {
    appendSelectedCandidate(draggedCandidate.value.id)
  }

  dropState.value = null
}

const handleAvailableZoneDragOver = (event: DragEvent) => {
  if (!draggedCandidate.value) return
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dropState.value = { target: 'available' }
}

const handleAvailableZoneDrop = (event: DragEvent) => {
  if (!draggedCandidate.value) return
  event.preventDefault()

  if (draggedCandidate.value.source === 'selected') {
    removeSelectedCandidate(draggedCandidate.value.id)
  }

  dropState.value = null
}

const selectedDropClass = (candidateId: number) => dropState.value?.target === 'selected' && dropState.value.candidateId === candidateId
  ? 'ring-2 ring-blue-400/60 bg-blue-50/60 dark:bg-blue-500/10'
  : ''

const submitEnqueue = async () => {
  if (!selectedCandidateIds.value.length) return
  isSubmitting.value = true
  try {
    const response = await $fetch<{ success: boolean, count: number }>('/api/admin/social-queue', {
      method: 'POST',
      body: {
        imageIds: selectedCandidateIds.value,
        platform: selectedPlatform.value,
        scheduledFor: scheduledFor.value || undefined,
      }
    })

    if (response.success) {
      toast({ title: 'Queued', description: `${response.count} illustration(s) added to the queue.`, toast: 'soft-success' })
      emit('submitted', {
        platform: selectedPlatform.value,
        imageIds: [...selectedCandidateIds.value],
        count: response.count,
      })
      dialogOpen.value = false
    }
  } catch (error) {
    console.error('Failed to enqueue items:', error)
    toast({ title: 'Error', description: 'Failed to add illustrations to the queue.', toast: 'soft-error' })
  } finally {
    isSubmitting.value = false
  }
}

const closeDialog = () => {
  dialogOpen.value = false
}

watch(() => props.open, async (open) => {
  if (!open) return
  await resetDialogState()
})

watch(selectedPlatform, () => {
  if (!dialogOpen.value || isResettingDialog.value) return
  candidateSearchQuery.value = ''
  candidateRows.value = []
  selectedCandidateIds.value = []
  clearCandidateCache()
  void loadCandidateRows({ search: '', updateVisible: true })
})

watch(candidateSearchQuery, () => {
  if (!dialogOpen.value) return
  refreshCandidateRows()
})
</script>