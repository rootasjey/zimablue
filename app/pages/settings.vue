<template>
  <main class="max-w-6xl mx-auto py-16 sm:py-24 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-1000">
    <header class="mb-20 sm:mb-24">
      <h1 class="text-4xl sm:text-5xl md:text-7xl font-900 tracking-tighter text-gray-900 dark:text-gray-100 mb-4">
        Settings
      </h1>
      <p class="text-lg text-gray-400 dark:text-gray-500 max-w-2xl font-body">
        Architecture, identity, and visual environment control.
      </p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
      <!-- Section Navigation -->
      <aside class="lg:col-span-3 space-y-1 sticky top-32 lg:block hidden">
        <div class="text-[10px] font-900 uppercase tracking-[.25em] text-gray-300 dark:text-gray-700 mb-6 pl-4">Registry</div>
        <button class="w-full text-left px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-800 text-sm transition-all shadow-sm">
          General
        </button>
        <button class="w-full text-left px-4 py-3 rounded-2xl text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all text-sm font-600">
          Account
        </button>
        <button class="w-full text-left px-4 py-3 rounded-2xl text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all text-sm font-600">
          Security
        </button>
      </aside>

      <section class="lg:col-span-9 space-y-16 sm:space-y-24">
        <!-- Profile Section -->
        <div v-if="loggedIn" class="animate-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div class="flex items-center gap-4 mb-8">
             <div class="w-10 h-10 rounded-xl bg-blue-500/5 flex items-center justify-center">
              <span class="i-ph-user-focus-duotone text-2xl text-blue-500/50"></span>
            </div>
            <h2 class="text-2xl font-900 text-gray-900 dark:text-gray-100 tracking-tight">Identity</h2>
          </div>

          <div class="rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-2 bg-gray-50/30 dark:bg-gray-900/10 transition-all hover:bg-white dark:hover:bg-gray-900 shadow-sm">
            <div class="rounded-[2.2rem] bg-white dark:bg-gray-950 p-8 sm:p-12">
              <UserInfo
                v-if="user"
                :isEditing="isEditing"
                :isSaving="isSaving"
                :formErrors="formErrors"
                :editForm="editForm"
                :profileData="profileData"
                :user="user"
                @cancelEditing="cancelEditing"
                @startEditing="startEditing"
                @saveProfile="saveProfile"
              />
            </div>
          </div>
        </div>

        <!-- Appearance Section -->
        <div class="animate-in slide-in-from-bottom-8 duration-1000 delay-400">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-10 h-10 rounded-xl bg-purple-500/5 flex items-center justify-center">
              <span class="i-ph-palette-duotone text-2xl text-purple-500/50"></span>
            </div>
            <h2 class="text-2xl font-900 text-gray-900 dark:text-gray-100 tracking-tight">Environment</h2>
          </div>

          <div class="rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-10 sm:p-14 bg-white dark:bg-gray-950 flex flex-col sm:flex-row items-center justify-between gap-10">
            <div class="max-w-md text-center sm:text-left">
              <h3 class="text-lg font-900 text-gray-900 dark:text-gray-100 mb-2">Interface Theme</h3>
              <p class="text-gray-400 dark:text-gray-500 leading-relaxed font-body">
                Adjust the visual resonance. Choose between high-contrast clarity, midnight depth, or automated synchronisation.
              </p>
            </div>
            <div class="shrink-0 w-full sm:w-56">
              <NSelect v-model="selectedTheme" :items="themeOptions" item-key="label" value-key="label" size="lg" class="rounded-2xl" />
            </div>
          </div>
        </div>

        <!-- Infrastructure -->
        <div class="flex items-center justify-between px-10 py-8 rounded-[2rem] bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100/50 dark:border-gray-800/50">
          <div class="flex items-center gap-3">
             <span class="i-ph-info text-gray-300 dark:text-gray-600"></span>
             <span class="text-xs font-800 uppercase tracking-widest text-gray-400">Engine Build</span>
          </div>
          <div class="px-5 py-2 rounded-full bg-white dark:bg-gray-800 text-[10px] font-900 tracking-[.2em] text-gray-400 dark:text-gray-500 uppercase border border-gray-100 dark:border-gray-700 shadow-sm">
            v{{ version || 'Release' }}
          </div>
        </div>
      </section>
    </div>

    <Footer class="mt-32 grayscale opacity-10" />
  </main>
</template>

<script setup lang="ts">
import { useAppSettings } from '~/composables/useAppSettings'
const settings = useAppSettings()
const { theme } = settings
const config = useRuntimeConfig()

const version = config.public.appVersion

import { computed, ref, reactive, onMounted } from 'vue'
import UserInfo from '~/components/user/UserInfo.vue'

const { loggedIn, user, fetch: refreshSession } = useUserSession()
const { toast } = useToast()

const themeOptions = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

const selectedTheme = computed({
  get: () => themeOptions.find(item => item.value === theme.value) ?? themeOptions[0],
  set: (v: any) => {
    theme.value = v?.value
  }
})

const isEditing = ref(false)
const isSaving = ref(false)
const formErrors = ref<Record<string, string>>({})

const editForm = reactive({
  name: '',
  email: '',
  biography: '',
  job: '',
  location: '',
  language: ''
})

const profileData = computed(() => ({
  name: user?.value?.name || '',
  email: user?.value?.email || '',
  biography: user?.value?.biography || '',
  job: user?.value?.job || '',
  location: user?.value?.location || '',
  language: user?.value?.language || '',
  createdAt: user?.value?.createdAt || ''
}))

onMounted(() => {
  if (user?.value) {
    editForm.name = user.value.name || ''
    editForm.email = user.value.email || ''
    editForm.biography = user.value.biography || ''
    editForm.job = user.value.job || ''
    editForm.location = user.value.location || ''
    editForm.language = user.value.language || ''
  }
})

const startEditing = () => {
  if (user?.value) {
    editForm.name = user.value.name || ''
    editForm.email = user.value.email || ''
    editForm.biography = user.value.biography || ''
    editForm.job = user.value.job || ''
    editForm.location = user.value.location || ''
    editForm.language = user.value.language || ''
  }
  formErrors.value = {}
  isEditing.value = true
}

const cancelEditing = () => {
  if (user?.value) {
    editForm.name = user.value.name || ''
    editForm.email = user.value.email || ''
    editForm.biography = user.value.biography || ''
    editForm.job = user.value.job || ''
    editForm.location = user.value.location || ''
    editForm.language = user.value.language || ''
  }
  formErrors.value = {}
  isEditing.value = false
}

const saveProfile = async () => {
  formErrors.value = {}
  if (!editForm.name) formErrors.value.name = 'Name is required'
  if (!editForm.email) formErrors.value.email = 'Email is required'

  if (Object.keys(formErrors.value).length) return

  // Build payload with changed fields only
  const payload: Record<string, any> = {}
  if (editForm.name !== profileData.value.name) payload.name = editForm.name
  if (editForm.email !== profileData.value.email) payload.email = editForm.email
  if (editForm.biography !== profileData.value.biography) payload.biography = editForm.biography
  if (editForm.job !== profileData.value.job) payload.job = editForm.job
  if (editForm.location !== profileData.value.location) payload.location = editForm.location
  if (editForm.language !== profileData.value.language) payload.language = editForm.language

  if (Object.keys(payload).length === 0) {
    toast({ title: 'No changes', description: 'No profile fields changed.', toast: 'soft-gray', duration: 2500 })
    return
  }

  isSaving.value = true

  try {
    const res = await $fetch('/api/user/profile', { method: 'PUT', body: payload })
    await refreshSession()
    isEditing.value = false
  } catch (err) {
    console.error('Failed to save profile', err)
    toast({ title: 'Error', description: 'Failed to update profile. Please try again.', toast: 'soft-error', duration: 4000 })
  } finally {
    isSaving.value = false
  }
}
</script>
