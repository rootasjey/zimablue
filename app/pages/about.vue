<template>
  <div class="about-wrapper mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-24 animate-in fade-in duration-1000">
    <!-- Header Section -->
    <header class="text-center mb-20 sm:mb-32">
      <div class="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-800 mb-10 animate-in zoom-in-95 duration-700">
        Perspective <span class="mx-2 opacity-20">|</span> v{{ version }}
      </div>

      <h1 class="font-title text-5xl sm:text-6xl md:text-8xl font-900 tracking-tighter text-gray-900 dark:text-gray-100 mb-8 bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-500">
        Zima Blue
      </h1>

      <p class="text-xl sm:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-body italic opacity-80">
        "A search for the ultimate blue, where art transcends the medium."
      </p>
    </header>

    <!-- Content -->
    <article class="grid grid-cols-1 lg:grid-cols-12 gap-16 sm:gap-24 text-left items-start">
      <!-- Left Column: Primary Text -->
      <div class="lg:col-span-7 space-y-16 sm:space-y-24">
        <!-- Who am I -->
        <section class="group animate-in slide-in-from-bottom-8 duration-1000 delay-100">
          <div class="space-y-6">
            <h2 class="text-3xl sm:text-4xl font-900 tracking-tight text-gray-900 dark:text-gray-100">
              The Illustrator & Engineer
            </h2>
            <div class="h-1 w-12 bg-blue-500/20 group-hover:w-24 transition-all duration-700"></div>
          </div>

          <div class="mt-8">
            <p class="text-lg sm:text-xl leading-relaxed text-gray-600 dark:text-gray-400 mb-8 font-body">
              I'm a self-taught illustrator and software engineer based in France. My work explores the intersection of
              technology and art, creating digital illustrations that blend technical precision with creative expression.
            </p>
            <NLink to="https://www.rootasjey.dev/resume" class="group/link flex items-center gap-3" target="_blank" rel="noopener noreferrer">
              <span class="text-xs font-800 uppercase tracking-widest text-gray-400 group-hover/link:text-blue-500 transition-colors">Curriculum Vitae</span>
              <div class="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800 group-hover/link:bg-blue-500/30 transition-colors"></div>
              <span class="i-ph-arrow-up-right text-gray-300 group-hover/link:text-blue-500"></span>
            </NLink>
          </div>
        </section>

        <!-- Licensing -->
        <section class="group animate-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div class="space-y-6">
            <h2 class="text-3xl sm:text-4xl font-900 tracking-tight text-gray-900 dark:text-gray-100">
              Open & Shared
            </h2>
            <div class="h-1 w-12 bg-purple-500/20 group-hover:w-24 transition-all duration-700"></div>
          </div>

          <div class="mt-8">
            <p class="text-lg sm:text-xl leading-relaxed text-gray-600 dark:text-gray-400 font-body">
              All illustrations on this site are free to use under the
              <NuxtLink href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank"
                class="font-800 text-gray-900 dark:text-white underline decoration-gray-200 dark:decoration-gray-800 hover:decoration-purple-500 decoration-4 underline-offset-8 transition-all duration-500">
                CC BY-SA 4.0 License
              </NuxtLink>.
              Feel free to share and adapt for any purpose, even commercially,
              as long as you provide credit and share alike.
            </p>
          </div>
        </section>
      </div>

      <!-- Right Column: Card & Socials -->
      <div class="lg:col-span-5 lg:sticky lg:top-32 space-y-8 animate-in slide-in-from-right-8 duration-1000 delay-500">
        <div class="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 sm:p-10 shadow-xl shadow-gray-200/20 dark:shadow-none relative overflow-hidden group">
          <!-- Decorative element -->
          <div class="absolute -right-12 -bottom-12 w-40 h-40 bg-blue-500/5 blur-3xl rounded-full"></div>

          <div class="relative space-y-8">
            <div class="space-y-3">
              <h3 class="text-2xl font-900 text-gray-900 dark:text-gray-100">
                Liaison
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                If my work or this project resonates with you, I'd love to hear from you.
                New ideas, collaborations, or just a simple hello.
              </p>
            </div>

            <div class="space-y-3">
              <NButton btn="solid-primary" size="xl" class="w-full font-800 rounded-2xl py-4 shadow-lg shadow-primary/20" @click="openContact">
                <span class="i-ph-paper-plane-right-fill mr-2"></span>
                Send a Message
              </NButton>
              <NLink to="/contact" class="block">
                <NButton btn="ghost-gray" size="md" class="w-full font-700 text-gray-400 hover:text-gray-900">
                  Detailed Contact
                </NButton>
              </NLink>
            </div>

            <div class="pt-8 border-t border-gray-50 dark:border-gray-800 flex flex-wrap gap-6 justify-center">
              <NLink to="https://github.com/rootasjey" target="_blank" rel="noopener noreferrer"
                class="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
                <div class="i-ph-github-logo text-2xl"></div>
              </NLink>
              <NLink to="https://www.instagram.com/rootasjey" target="_blank" rel="noopener noreferrer"
                class="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
                <div class="i-ph-instagram-logo text-2xl"></div>
              </NLink>
              <NLink to="https://www.linkedin.com/in/jeremiecorpinot/" target="_blank" rel="noopener noreferrer"
                class="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
                <div class="i-ph-linkedin-logo text-2xl"></div>
              </NLink>
            </div>
          </div>
        </div>
      </div>
    </article>

    <NDialog
      v-model:open="isContactOpen"
      :ui="{ width: 'sm:max-w-lg', padding: 'p-0' }"
      class="hidden sm:block"
    >
      <div class="p-10">
        <h3 class="text-3xl font-900 mb-2 tracking-tight">Send a message</h3>
        <p class="text-sm text-gray-400 mb-10">Collaborations, enquiries or just hellos.</p>
        <AboutContactForm
          :email="formData.email"
          :subject="formData.subject"
          :message="formData.message"
          :loading="isSubmitting"
          @update:email="val => formData.email = val"
          @update:subject="val => formData.subject = val"
          @update:message="val => formData.message = val"
          @submit="submitForm"
        />
      </div>
    </NDialog>

    <!-- Mobile bottom drawer -->
    <NDrawer v-model:open="isDrawerOpen" class="sm:hidden">
      <NDrawerContent class="w-full max-w-[100vw] bottom-0 rounded-t-[2.5rem] bg-white dark:bg-gray-950">
        <div class="px-8 pt-12 pb-10">
          <h3 class="text-3xl font-900 mb-2 tracking-tight">Send a message</h3>
          <p class="text-sm text-gray-400 mb-10">Collaborations, enquiries or hellos.</p>
          <AboutContactForm
            :email="formData.email"
            :subject="formData.subject"
            :message="formData.message"
            :loading="isSubmitting"
            @update:email="val => formData.email = val"
            @update:subject="val => formData.subject = val"
            @update:message="val => formData.message = val"
            @submit="submitForm"
          />
        </div>
      </NDrawerContent>
    </NDrawer>

    <Footer class="mt-48 grayscale opacity-20 hover:opacity-100 hover:grayscale-0 transition-all duration-1000" />
  </div>
</template>

<script lang="ts" setup>
import AboutContactForm from '~/components/about/AboutContactForm.vue'
const config = useRuntimeConfig()
const { toast } = useToast()
const randomColors = useRandomColors()

const version = config.public.appVersion

const formData = reactive({
  email: '',
  subject: '',
  message: ''
})

const isSubmitting = ref(false)
const showSuccess = ref(false)
const hasError = ref(false)
const isContactOpen = ref(false)
const isDrawerOpen = ref(false)

function openContact() {
  try {
    const breakpoints = useBreakpoints({ sm: 0, md: 768 })
    const isMobile = breakpoints.smaller('md')
    if (isMobile.value) {
      isDrawerOpen.value = true
    } else {
      isContactOpen.value = true
    }
  } catch (e) {
    // fallback to dialog
    isContactOpen.value = true
  }
}

async function submitForm() {
  isSubmitting.value = true
  showSuccess.value = false
  hasError.value = false

  try {
    const { data } = await useFetch('/api/messages', {
      method: 'POST',
      body: {
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      }
    })

    showSuccess.value = true
    isContactOpen.value = false
    isDrawerOpen.value = false

    // Reset form
    formData.email = ''
    formData.subject = ''
    formData.message = ''

    toast({
      title: 'Message Sent',
      description: 'Thank you for your message. I\'ll get back to you soon.',
      toast: 'soft-success',
      duration: 5000
    })
  } catch (error) {
    console.error('Error submitting form:', error)
    hasError.value = true

    toast({
      title: 'Error',
      description: 'Failed to send your message. Please try again.',
      toast: 'soft-error',
      duration: 5000
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.about-wrapper :deep(h2) {
  scroll-margin-top: 96px;
}

/* Subtle keyframe used by legacy icons */
.i-ph-sun-horizon,
.i-line-md\:moon-to-sunny-outline-loop-transition {
  animation: fadeScale 0.3s ease-in-out;
}

@keyframes fadeScale {
  0% {
    opacity: 0;
    transform: scale(0.98);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
