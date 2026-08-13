<template>
  <main class="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-gray-900">
    <form class="w-full max-w-sm space-y-5" @submit.prevent="submit">
      <div>
        <NuxtLink to="/login" class="text-sm text-sky-600 hover:underline">Back to sign in</NuxtLink>
        <h1 class="mt-6 text-2xl text-gray-900 dark:text-gray-100">Choose a new password</h1>
        <p class="mt-2 text-sm text-gray-500">Use at least 8 characters.</p>
      </div>
      <label class="block text-sm text-gray-700 dark:text-gray-300">
        New password
        <NInput v-model="password" type="password" required minlength="8" class="mt-2 w-full" autocomplete="new-password" />
      </label>
      <label class="block text-sm text-gray-700 dark:text-gray-300">
        Confirm password
        <NInput v-model="confirmation" type="password" required minlength="8" class="mt-2 w-full" autocomplete="new-password" />
      </label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="message" class="text-sm text-green-600">{{ message }}</p>
      <button type="submit" :disabled="submitting || !token" class="w-full rounded-xl bg-sky-600 px-4 py-3 text-white disabled:opacity-50">
        {{ submitting ? 'Updating...' : 'Update password' }}
      </button>
    </form>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const token = String(route.query.token || '')
const password = ref('')
const confirmation = ref('')
const submitting = ref(false)
const error = ref(token ? '' : 'This password reset link is missing its token.')
const message = ref('')

const submit = async () => {
  error.value = ''
  message.value = ''
  if (password.value !== confirmation.value) {
    error.value = 'Passwords do not match.'
    return
  }
  submitting.value = true
  try {
    const response = await $fetch('/api/password-reset/reset', { method: 'POST', body: { token, password: password.value } })
    message.value = response.message || 'Password reset successfully. You can now sign in.'
  } catch (cause: unknown) {
    error.value = (cause as { data?: { message?: string } }).data?.message || 'Unable to reset your password.'
  } finally {
    submitting.value = false
  }
}
</script>
