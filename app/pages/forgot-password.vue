<template>
  <main class="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-gray-900">
    <form class="w-full max-w-sm space-y-5" @submit.prevent="submit">
      <div>
        <NuxtLink to="/login" class="text-sm text-sky-600 hover:underline">Back to sign in</NuxtLink>
        <h1 class="mt-6 text-2xl text-gray-900 dark:text-gray-100">Forgot your password?</h1>
        <p class="mt-2 text-sm text-gray-500">Enter your email and we'll send a reset link if an account exists.</p>
      </div>
      <label class="block text-sm text-gray-700 dark:text-gray-300">
        Email
        <NInput v-model="email" type="email" required class="mt-2 w-full" autocomplete="email" />
      </label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="message" class="text-sm text-green-600">{{ message }}</p>
      <button type="submit" :disabled="submitting" class="w-full rounded-xl bg-sky-600 px-4 py-3 text-white disabled:opacity-50">
        {{ submitting ? 'Sending...' : 'Send reset link' }}
      </button>
    </form>
  </main>
</template>

<script setup lang="ts">
const email = ref('')
const submitting = ref(false)
const error = ref('')
const message = ref('')

const submit = async () => {
  submitting.value = true
  error.value = ''
  message.value = ''
  try {
    const response = await $fetch('/api/password-reset/request', { method: 'POST', body: { email: email.value } })
    message.value = response.message || 'If an account exists for that email, a reset link has been sent.'
  } catch (cause: unknown) {
    error.value = (cause as { data?: { message?: string } }).data?.message || 'Unable to request a reset link.'
  } finally {
    submitting.value = false
  }
}
</script>
