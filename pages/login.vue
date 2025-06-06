<template>
  <div class="frame">
    <!-- Header -->
    <header class="mt-12 mb-8">
      <div class="flex gap-2">
        <ULink to="/" class="hover:scale-102 active:scale-99 transition">
          <span class="i-ph-house-simple-duotone"></span>
        </ULink>
        <span>•</span>
        <h1 class="font-body text-xl font-600 text-gray-800 dark:text-gray-200">
          {{ isLogin ? 'Sign in' : 'Sign up' }}
        </h1>
      </div>
      <div class="w-40 flex text-center justify-center my-2">
        <div class="w-full h-2">
          <svg viewBox="0 0 300 10" preserveAspectRatio="none">
            <path d="M 0 5 Q 15 0, 30 5 T 60 5 T 90 5 T 120 5 T 150 5 T 180 5 T 210 5 T 240 5 T 270 5 T 300 5"
              stroke="currentColor" fill="none" class="text-gray-300 dark:text-gray-700" stroke-width="1" />
          </svg>
        </div>
      </div>
      <p class="text-gray-700 dark:text-gray-300 text-sm opacity-75">
        {{ isLogin ? 'Welcome back' : 'Create your account' }}
      </p>
    </header>

    <!-- Login Form -->
    <section class="mb-12">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <span class="i-ph-envelope mr-2"></span>
            Email <span class="text-[#EC7FA9] dark:text-[#FFB8E0]">*</span>
          </label>
          <UInput
            id="email"
            v-model="email"
            type="email"
            placeholder="your@email.com"
            required
            class="w-full"
            :ui="{ 
              base: 'transition duration-200',
              rounded: 'rounded-lg',
              color: {
                gray: {
                  outline: 'bg-white dark:bg-gray-900 ring-1 ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
                }
              }
            }"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <span class="i-ph-lock mr-2"></span>
            Password <span class="text-[#EC7FA9] dark:text-[#FFB8E0]">*</span>
          </label>
          <UInput
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            required
            class="w-full"
            :ui="{ 
              base: 'transition duration-200',
              rounded: 'rounded-lg',
              color: {
                gray: {
                  outline: 'bg-white dark:bg-gray-900 ring-1 ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
                }
              }
            }"
          />
        </div>

        <div class="pt-4">
          <UButton
            type="submit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            class="w-full"
          >
          {{ isLogin ? 'Sign in' : 'Sign up' }}
          <span :class="isLogin ? 'i-ph-sign-in-bold' : 'i-ph-user-plus'"></span>
          </UButton>
        </div>

        <!-- Error Alert -->
        <UAlert
          v-if="error"
          class="mt-4"
          color="red"
          variant="soft"
          title="Authentication Error"
          icon="i-ph-warning-circle"
          :close-button="{ icon: 'i-ph-x', color: 'gray' }"
          @close="error = ''"
        >
          {{ error }}
        </UAlert>

        <!-- Toggle between login/signup -->
        <div class="text-center pt-4">
          <UButton
            type="button"
            @click="toggleMode"
            btn="text"
            size="sm"
            :class="randomColors.getTextColorClasses()"
          >
            {{ isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in' }}
          </UButton>
        </div>
      </form>
    </section>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const { loggedIn, fetch: refreshSession } = useUserSession()
const randomColors = useRandomColors()

const email = ref('')
const password = ref('')
const error = ref('')
const isLogin = ref(true)
const isSubmitting = ref(false)

onMounted(async () => {
  if (loggedIn.value) {
    await navigateTo('/')
  }
})

watch(loggedIn, (newValue) => {
  if (newValue) {
    navigateTo('/')
  }
})

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
}

const handleSubmit = async () => {
  error.value = ""
  isSubmitting.value = true

  if (isLogin.value) {
    try {
      await $fetch('/api/login', {
        method: 'POST',
        body: {
          email: email.value,
          password: password.value,
        },
      })
      
      await refreshSession()
      await navigateTo('/')
    } catch (e) {
      error.value = e.data?.message || 'Invalid credentials. Please try again.'
    }
  } else {
    // Sign up logic - placeholder for now
    error.value = 'Sign up functionality not yet implemented.'
  }

  isSubmitting.value = false
}
</script>

<style scoped>
.frame {
  width: 500px;
  border-radius: 0.75rem;
  padding: 2rem;
  padding-bottom: 38vh;
  display: flex;
  flex-direction: column;
  transition-property: all;
  transition-duration: 500ms;
  overflow-y: auto;
}
</style>
