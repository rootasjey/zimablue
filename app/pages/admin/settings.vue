<template>
  <div class="space-y-6">
      <!-- Settings Sections -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Appearance Settings -->
        <div class="admin-card p-6">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span class="i-ph-palette text-amber-600 dark:text-amber-400"></span>
            </div>
            <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Appearance</h2>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-600 text-stone-700 mb-2 dark:text-zinc-300">Theme</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="themeOption in themeOptions"
                  :key="themeOption.value"
                  @click="selectedTheme = themeOption.value"
                  class="px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium"
                  :class="selectedTheme === themeOption.value 
                    ? 'border-amber-500 bg-amber-500 text-white' 
                    : 'bg-stone-100 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-stone-400'"
                >
                  <span :class="themeOption.icon" class="text-lg mb-1"></span>
                  <div>{{ themeOption.label }}</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Settings -->
        <div class="admin-card p-6">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <span class="i-ph-user text-cyan-600 dark:text-cyan-400"></span>
            </div>
            <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Profile</h2>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-600 text-stone-700 mb-2 dark:text-zinc-300">Username</label>
              <NInput
                v-model="formData.username"
                placeholder="Enter your username"
                size="lg"
                class="w-full border-stone-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label class="block text-sm font-600 text-stone-700 mb-2 dark:text-zinc-300">Email</label>
              <NInput
                v-model="formData.email"
                type="email"
                placeholder="Enter your email"
                size="lg"
                disabled
                class="w-full border-stone-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              />
              <p class="text-xs text-stone-500 mt-1 dark:text-zinc-400">Email cannot be changed</p>
            </div>

            <div>
              <label class="block text-sm font-600 text-stone-700 mb-2 dark:text-zinc-300">Job Title</label>
              <NInput
                v-model="formData.job"
                placeholder="e.g., Administrator"
                size="lg"
                class="w-full border-stone-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label class="block text-sm font-600 text-stone-700 mb-2 dark:text-zinc-300">Location</label>
              <NInput
                v-model="formData.location"
                placeholder="e.g., New York, USA"
                size="lg"
                class="w-full border-stone-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        <!-- Security Settings -->
        <div class="admin-card p-6 lg:col-span-2">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <span class="i-ph-lock text-rose-600 dark:text-rose-400"></span>
            </div>
            <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Security</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-600 text-stone-700 mb-2 dark:text-zinc-300">Current Password</label>
              <NInput
                v-model="formData.currentPassword"
                type="password"
                placeholder="Enter current password"
                size="lg"
                class="w-full border-stone-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label class="block text-sm font-600 text-stone-700 mb-2 dark:text-zinc-300">New Password</label>
              <NInput
                v-model="formData.newPassword"
                type="password"
                placeholder="Enter new password"
                size="lg"
                class="w-full border-stone-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label class="block text-sm font-600 text-stone-700 mb-2 dark:text-zinc-300">Confirm New Password</label>
              <NInput
                v-model="formData.confirmPassword"
                type="password"
                placeholder="Confirm new password"
                size="lg"
                class="w-full border-stone-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <button
          class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
          @click="resetForm"
        >
          Cancel
        </button>
        <button
          class="px-4 h-9 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
          @click="saveSettings"
          :disabled="isSaving"
        >
          <span v-if="isSaving" class="i-ph-spinner-gap animate-spin mr-1.5 inline-block"></span>
          Save Changes
        </button>
      </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const { user } = useUserSession()
const { toast } = useToast()

// Theme options
const themeOptions = [
  { value: 'light', label: 'Light', icon: 'i-ph-sun' },
  { value: 'dark', label: 'Dark', icon: 'i-ph-moon' },
  { value: 'system', label: 'System', icon: 'i-ph-monitor' },
]

// Wire theme selector to Nuxt color mode
const { $colorMode } = useNuxtApp()
// Initialize selectedTheme from current preference/value
const selectedTheme = ref($colorMode.preference || $colorMode.value || 'system')
// Keep Nuxt color mode in sync when user changes selection
watch(selectedTheme, (val) => {
  // map our values directly to $colorMode.preference which accepts 'light'|'dark'|'system'
  if (val === 'light' || val === 'dark' || val === 'system') {
    $colorMode.preference = val
  }
})
const isSaving = ref(false)

const formData = ref({
  username: user.value?.name || '',
  email: user.value?.email || '',
  job: '',
  location: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// Initialize form with user data
onMounted(() => {
  if (user.value) {
    formData.value.username = user.value.name || ''
    formData.value.email = user.value.email || ''
    // TODO: Load job and location from user profile when available
  }
})

// Reset form
const resetForm = () => {
  formData.value = {
    username: user.value?.name || '',
    email: user.value?.email || '',
    job: '',
    location: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  // restore selected theme from current app preference
  selectedTheme.value = $colorMode.preference || $colorMode.value || 'system'
}

// Save settings
const saveSettings = async () => {
  // Validate password fields
  if (formData.value.newPassword || formData.value.confirmPassword) {
    if (!formData.value.currentPassword) {
      toast({
        title: 'Error',
        description: 'Please enter your current password to change it.',
        toast: 'soft-error',
        duration: 5000
      })
      return
    }

    if (formData.value.newPassword !== formData.value.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        toast: 'soft-error',
        duration: 5000
      })
      return
    }

    if (formData.value.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long.',
        toast: 'soft-error',
        duration: 5000
      })
      return
    }
  }

  isSaving.value = true

  try {
    // TODO: Implement API call to save settings
    // For now, just show success message
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: 'Success',
      description: 'Settings saved successfully.',
      toast: 'soft-success',
      duration: 5000
    })

    // Clear password fields after successful save
    formData.value.currentPassword = ''
    formData.value.newPassword = ''
    formData.value.confirmPassword = ''
  } catch (error) {
    console.error('Error saving settings:', error)
    toast({
      title: 'Error',
      description: 'Failed to save settings. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isSaving.value = false
  }
}
</script>

