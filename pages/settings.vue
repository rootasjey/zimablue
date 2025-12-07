<template>
  <main class="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-700 text-gray-900 dark:text-white">Settings</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Control app behaviour and appearance</p>
      </div>
    </div>

    <section class="space-y-6">
      <div v-if="loggedIn" class="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 bg-white/70 dark:bg-gray-900/30">
        <div class="mt-4">
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
      <div class="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 bg-white/70 dark:bg-gray-900/30">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h2 class="text-lg font-700 text-gray-900 dark:text-white">Interactive click fireworks</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Toggle the global click fireworks effect in the application (triggered on clicks).</p>
          </div>
            <div class="shrink-0 flex items-center">
            <USwitch v-model="fireworksEnabled" />
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 bg-white/70 dark:bg-gray-900/30">
        <div class="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div class="flex-1">
            <h2 class="text-lg font-700 text-gray-900 dark:text-white">App theme</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose your preferred theme. System will follow the OS preference.</p>
          </div>
          <div class="shrink-0 w-48">
            <USelect v-model="selectedTheme" :items="themeOptions" item-key="label" value-key="label" size="sm" />
          </div>
        </div>
      </div>
      
      <div class="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 bg-white/70 dark:bg-gray-900/30 mt-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h2 class="text-lg font-700 text-gray-900 dark:text-white">App version</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">The current application version built into runtime config.</p>
          </div>
          <div class="shrink-0 flex items-center text-sm text-gray-700 dark:text-gray-300">
            {{ version || '—' }}
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useAppSettings } from '~/composables/useAppSettings'
const settings = useAppSettings()
const { fireworksEnabled, theme } = settings
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
