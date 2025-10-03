<template>
  <div>
    <!-- Access Control -->
    <div v-if="!loggedIn || user?.role !== 'admin'" class="text-center py-12">
      <div class="i-ph-lock text-6xl text-gray-400 mb-4"></div>
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Access Denied</h2>
      <p class="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
      <UButton to="/user" class="mt-4">Go to Profile</UButton>
    </div>

    <!-- Settings Content -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-700 text-gray-900">Settings</h1>
          <p class="text-gray-600 mt-1">Manage your account and application preferences.</p>
        </div>
      </div>

      <!-- Settings Sections -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Appearance Settings -->
        <div class="rounded-[28px] p-6 bg-[#D1E0E9] border border-[#b7cbd8]">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
              <span class="i-ph-palette text-white text-xl"></span>
            </div>
            <h2 class="text-xl font-700 text-gray-900">Appearance</h2>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-600 text-gray-700 mb-2">Theme</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="themeOption in themeOptions"
                  :key="themeOption.value"
                  @click="selectedTheme = themeOption.value"
                  class="px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium"
                  :class="selectedTheme === themeOption.value 
                    ? 'border-black bg-black text-white' 
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'"
                >
                  <span :class="themeOption.icon" class="text-lg mb-1"></span>
                  <div>{{ themeOption.label }}</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Settings -->
        <div class="rounded-[28px] p-6 bg-[#D1E0E9] border border-[#b7cbd8]">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
              <span class="i-ph-user text-white text-xl"></span>
            </div>
            <h2 class="text-xl font-700 text-gray-900">Profile</h2>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-600 text-gray-700 mb-2">Username</label>
              <UInput
                v-model="formData.username"
                placeholder="Enter your username"
                size="lg"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-600 text-gray-700 mb-2">Email</label>
              <UInput
                v-model="formData.email"
                type="email"
                placeholder="Enter your email"
                size="lg"
                class="w-full"
                disabled
              />
              <p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label class="block text-sm font-600 text-gray-700 mb-2">Job Title</label>
              <UInput
                v-model="formData.job"
                placeholder="e.g., Administrator"
                size="lg"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-600 text-gray-700 mb-2">Location</label>
              <UInput
                v-model="formData.location"
                placeholder="e.g., New York, USA"
                size="lg"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Security Settings -->
        <div class="rounded-[28px] p-6 bg-[#D1E0E9] border border-[#b7cbd8] lg:col-span-2">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
              <span class="i-ph-lock text-white text-xl"></span>
            </div>
            <h2 class="text-xl font-700 text-gray-900">Security</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-600 text-gray-700 mb-2">Current Password</label>
              <UInput
                v-model="formData.currentPassword"
                type="password"
                placeholder="Enter current password"
                size="lg"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-600 text-gray-700 mb-2">New Password</label>
              <UInput
                v-model="formData.newPassword"
                type="password"
                placeholder="Enter new password"
                size="lg"
                class="w-full"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-600 text-gray-700 mb-2">Confirm New Password</label>
              <UInput
                v-model="formData.confirmPassword"
                type="password"
                placeholder="Confirm new password"
                size="lg"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3 pt-4">
        <UButton
          btn="soft-gray"
          size="lg"
          @click="resetForm"
        >
          Cancel
        </UButton>
        <UButton
          btn="solid-black"
          size="lg"
          @click="saveSettings"
          :loading="isSaving"
        >
          Save Changes
        </UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { loggedIn, user } = useUserSession()
const { toast } = useToast()

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

// Theme options
const themeOptions = [
  { value: 'light', label: 'Light', icon: 'i-ph-sun' },
  { value: 'dark', label: 'Dark', icon: 'i-ph-moon' },
  { value: 'system', label: 'System', icon: 'i-ph-monitor' },
]

// Form state
const selectedTheme = ref('light')
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
  selectedTheme.value = 'light'
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

