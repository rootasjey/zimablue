<template>
  <div class="min-h-96vh flex flex-col lg:flex-row">
    <!-- Left Side - Visual/Brand Section (hidden on mobile) -->
    <div class="hidden rounded-2xl lg:flex lg:w-1/2 relative bg-[#0066CC] overflow-hidden">
      <!-- Animated gradient mesh with bike-ride colors -->
      <div class="absolute inset-0">
        <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-400/30 via-transparent to-transparent"></div>
        <div class="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-500/30 via-transparent to-transparent"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-300/20 via-transparent to-transparent"></div>
      </div>
      
      <!-- Floating shapes with neon colors -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-20 left-20 w-64 h-64 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 blur-3xl animate-float"></div>
        <div class="absolute bottom-32 right-20 w-48 h-48 rounded-full bg-gradient-to-br from-pink-500/40 to-fuchsia-500/30 blur-3xl animate-float-delayed"></div>
        <div class="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300/30 to-amber-400/20 blur-2xl animate-float-slow"></div>
        <!-- Speed lines like in the image -->
        <div class="absolute top-1/4 left-0 w-32 h-1 bg-gradient-to-r from-cyan-400 to-transparent rounded-full animate-speed-line"></div>
        <div class="absolute top-1/3 right-0 w-48 h-1 bg-gradient-to-l from-yellow-300 to-transparent rounded-full animate-speed-line-delayed"></div>
        <div class="absolute bottom-1/4 left-0 w-40 h-1 bg-gradient-to-r from-pink-400 to-transparent rounded-full animate-speed-line-slow"></div>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col justify-between p-12 text-white">
        <div>
          <NuxtLink to="/" class="inline-flex items-center gap-3 group">
            <NuxtImg src="/images/logo-192.png" alt="Zima Blue Logo" width="28" height="28" class="rounded-2 shadow-lg shadow-black/20 group-hover:scale-105 transition-transform" />
            <span class="text-2xl font-600 font-body">Zima Blue</span>
          </NuxtLink>
        </div>
        
        <div class="max-w-md">
          <h2 class="text-6xl font-200 mb-4 leading-tight">
            Your creative space for <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-yellow-300">beautiful imagery</span>
          </h2>
          <p class="text-white/70 text-lg">
            Organize, showcase, and share your visual content with an elegant gallery experience.
          </p>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex -space-x-2">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 ring-2 ring-[#0066CC]"></div>
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 ring-2 ring-[#0066CC]"></div>
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 ring-2 ring-[#0066CC]"></div>
          </div>
          <p class="text-white/60 text-sm">Join our creative community</p>
        </div>
      </div>
    </div>

    <!-- Right Side - Form Section -->
    <div class="flex-1 flex flex-col bg-white dark:bg-gray-900">
      <!-- Mobile header -->
      <div class="flex flex-col items-center lg:hidden p-4 border-b border-dashed border-gray-100 dark:border-gray-800">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <NuxtImg src="/images/logo-192.png" alt="Zima Blue Logo" width="32" height="32" class="rounded-md" />
        </NuxtLink>
        <span class="mt-2 font-body text-size-6 font-600 text-gray-900 dark:text-white">Zima Blue</span>
      </div>

      <!-- Form container -->
      <div class="flex-1 flex items-start lg:items-start justify-center p-6 sm:p-8 lg:p-12 pb-32 sm:pb-8">
        <Transition name="card-appear" appear>
          <div class="w-full max-w-sm form-card">
            <!-- Tabs -->
            <div class="relative flex mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl tab-wrapper">
              <!-- moving pill to indicate active tab -->
              <div class="absolute inset-1 rounded-lg bg-white dark:bg-gray-700 tab-active transform transition-transform duration-300 ease-out" :class="isLogin ? 'translate-x-0' : 'translate-x-full'"></div>
              <button
                type="button"
                @click="isLogin = true"
                class="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 relative z-10"
                :class="isLogin 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
              >
                Sign in
              </button>
              <button
                type="button"
                @click="isLogin = false"
                class="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 relative z-10"
                :class="!isLogin 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
              >
                Sign up
              </button>
            </div>

            <!-- Header + Form (swap when changing tabs) -->
            <Transition name="form-swap" mode="out-in">
              <div :key="isLogin ? 'login' : 'signup'">
                <!-- Header -->
                <div class="mb-6">
                  <h1 class="text-2xl font-400 text-gray-900 dark:text-white">
                    {{ isLogin ? 'Welcome back' : 'Get started' }}
                  </h1>
                  <p class="mt-1 text-gray-500 dark:text-gray-400 text-sm">
                    {{ isLogin ? 'Enter your credentials to access your account' : 'Create your account to start organizing' }}
                  </p>
                </div>

                <!-- Form -->
                <form @submit.prevent="handleSubmit" class="space-y-4" key="form">
                  <!-- Name (signup only) -->
                  <div v-if="!isLogin">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                    <div class="relative">
                      <UInput
                        input="~"
                        v-model="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        leading="i-ph-user"
                        class="w-full pl-10 pr-4 py-5.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  <!-- Email -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <UInput
                      input="~"
                      v-model="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      leading="i-ph-envelope"
                      class="w-full pl-10 pr-4 py-5.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                    />
                  </div>

                  <!-- Password -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                    <UInput
                      input="~"
                      v-model="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      leading="i-ph-key"
                      class="w-full pl-10 pr-4 py-5.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                    />
                    <p v-if="!isLogin" class="mt-1 text-xs text-gray-500">At least 8 characters</p>
                  </div>

                  <!-- Master Password (signup only) -->
                  <div v-if="!isLogin">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Master Password</label>
                    <UInput
                      input="~"
                      v-model="masterPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      leading="i-ph-lock"
                      class="w-full pl-10 pr-4 py-5.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                    />
                    <p class="mt-1 text-xs text-gray-500">Required for account creation</p>
                  </div>

                  <!-- Optional fields toggle -->
                  <div v-if="!isLogin">
                    <button
                      type="button"
                      @click="showOptionalFields = !showOptionalFields"
                      class="text-sm text-sky-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span :class="showOptionalFields ? 'i-ph-caret-up' : 'i-ph-caret-down'"></span>
                      {{ showOptionalFields ? 'Less options' : 'More options' }}
                    </button>
                  </div>

                  <!-- Optional fields -->
                  <Transition name="collapse">
                    <div v-if="!isLogin && showOptionalFields" class="space-y-4 pt-2">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
                        <UInput
                          input="~"
                          type="textarea"
                          v-model="biography"
                          placeholder="Tell us about yourself..."
                          rows="2"
                          class="w-full px-4 py-5.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all resize-none"
                        />
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Job</label>
                          <UInput
                            input="~"
                            v-model="job"
                            type="text"
                            placeholder="Designer"
                            class="w-full px-4 py-5.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                          />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
                          <UInput
                            input="~"
                            v-model="location"
                            type="text"
                            placeholder="Paris, FR"
                            class="w-full px-4 py-5.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </Transition>

                  <!-- Error -->
                  <Transition name="fade">
                    <div v-if="error" class="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-600 dark:text-red-400">
                      <span class="i-ph-warning-circle flex-shrink-0"></span>
                      <span>{{ error }}</span>
                      <button @click="error = ''" class="ml-auto i-ph-x hover:text-red-800 dark:hover:text-red-300"></button>
                    </div>
                  </Transition>

                  <!-- Success -->
                  <Transition name="fade">
                    <div v-if="successMessage" class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-xl text-sm text-green-600 dark:text-green-400">
                      <span class="i-ph-check-circle flex-shrink-0"></span>
                      <span>{{ successMessage }}</span>
                    </div>
                  </Transition>

                  <!-- Submit -->
                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="w-full py-3 px-4 bg-gradient-to-r from-[#0077CC] via-sky-500 to-cyan-400 text-white font-medium rounded-xl hover:from-[#0066BB] hover:via-sky-600 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40"
                  >
                    <span v-if="isSubmitting" class="i-ph-spinner animate-spin"></span>
                    <span>{{ isLogin ? 'Sign in' : 'Create account' }}</span>
                    <span v-if="!isSubmitting" :class="isLogin ? 'i-ph-arrow-right' : 'i-ph-user-plus'"></span>
                  </button>
                </form>
              </div>
            </Transition>

          <!-- Footer -->
          <p class="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const { loggedIn, fetch: refreshSession } = useUserSession()

// Form fields
const name = ref('')
const email = ref('')
const password = ref('')
const masterPassword = ref('')
const biography = ref('')
const job = ref('')
const location = ref('')

// UI state
const error = ref('')
const successMessage = ref('')
const isLogin = ref(true)
const isSubmitting = ref(false)
const showOptionalFields = ref(false)

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

watch(isLogin, () => {
  error.value = ''
  successMessage.value = ''
  if (isLogin.value) {
    name.value = ''
    biography.value = ''
    job.value = ''
    location.value = ''
    masterPassword.value = ''
    showOptionalFields.value = false
  }
})

const handleSubmit = async () => {
  error.value = ""
  successMessage.value = ""
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
    try {
      if (name.value.length < 2) {
        error.value = 'Name must be at least 2 characters long.'
        isSubmitting.value = false
        return
      }
      
      if (password.value.length < 8) {
        error.value = 'Password must be at least 8 characters long.'
        isSubmitting.value = false
        return
      }
      
      if (masterPassword.value.length === 0) {
        error.value = 'Master password is required.'
        isSubmitting.value = false
        return
      }

      const response = await $fetch('/api/register', {
        method: 'POST',
        body: {
          name: name.value,
          email: email.value,
          password: password.value,
          masterPassword: masterPassword.value,
          biography: biography.value || undefined,
          job: job.value || undefined,
          location: location.value || undefined,
        },
      })
      
      successMessage.value = response.message || 'Account created successfully!'
      await refreshSession()
      
      setTimeout(async () => {
        await navigateTo('/')
      }, 1500)
      
    } catch (e) {
      console.error('Registration error:', e)
      error.value = e.data?.message || 'Failed to create account. Please try again.'
    }
  }

  isSubmitting.value = false
}
</script>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(-5deg); }
}

@keyframes float-slow {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 8s ease-in-out infinite;
  animation-delay: 1s;
}

.animate-float-slow {
  animation: float-slow 10s ease-in-out infinite;
  animation-delay: 2s;
}

@keyframes speed-line {
  0% { transform: translateX(-100%); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateX(100vw); opacity: 0; }
}

.animate-speed-line {
  animation: speed-line 4s ease-in-out infinite;
}

.animate-speed-line-delayed {
  animation: speed-line 5s ease-in-out infinite;
  animation-delay: 1.5s;
}

.animate-speed-line-slow {
  animation: speed-line 6s ease-in-out infinite;
  animation-delay: 3s;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 500px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* --- New transitions & micro-interactions for login form --- */

/* Form card appear on mount */
.card-appear-enter-active,
.card-appear-leave-active {
  transition: opacity 250ms ease, transform 250ms ease;
}
.card-appear-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.995);
}
.card-appear-enter-to {
  opacity: 1;
  transform: none;
}

/* Swapping header + form when switching tabs */
.form-swap-enter-active,
.form-swap-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}
.form-swap-enter-from { opacity: 0; transform: translateY(6px); }
.form-swap-enter-to   { opacity: 1; transform: none; }
.form-swap-leave-from { opacity: 1; transform: none; }
.form-swap-leave-to   { opacity: 0; transform: translateY(-6px); }

/* Tabs - sliding active pill */
.tab-wrapper { position: relative; }
.tab-active {
  left: 0.25rem; /* matches inset-1 */
  top: 0.25rem;
  bottom: 0.25rem;
  right: auto;
  width: calc(50% - 0.5rem);
  z-index: 0;
}

/* Ensure buttons sit above the active pill */
.tab-wrapper > button { position: relative; z-index: 10; }

/* Input focus micro-interaction */
input[type="text"], input[type="email"], input[type="password"], textarea {
  transition: box-shadow 180ms ease, transform 160ms ease, border-color 150ms;
}
input:focus, textarea:focus {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(2,132,199,0.08);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .tab-active, .card-appear-enter-active, .form-swap-enter-active, input[type="text"], textarea { transition: none !important; animation: none !important; transform: none !important; }
}
</style>
