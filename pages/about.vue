<template>
  <div class="about-wrapper mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14 animate-in fade-in duration-500">
    <div class="text-center">
    </div>
      <div class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 mb-4 animate-in zoom-in-95">
        <span class="i-ph-sparkle mr-1"></span>
        About this project • v{{ version }}
      </div>

    <!-- Content -->
    <article class="mt-6 space-y-10 sm:space-y-12 text-left">
      <!-- Who am I -->
      <section class="prose-section animate-in slide-in-from-bottom-2">
        <h2 class="text-xl sm:text-2xl font-700 text-gray-900 dark:text-gray-100 mb-3">
          <span class="i-ph-user-circle mr-2"></span>
          Who's behind this gallery?
        </h2>
        <p class="leading-relaxed text-gray-700 dark:text-gray-300">
          I'm a self-taught illustrator and software engineer based in France. My work explores the intersection of
          technology and art, creating digital illustrations that blend technical precision with creative expression.
        </p>
        <NLink to="https://www.rootasjey.dev/resume" class="arrow mt-3 inline-flex" target="_blank" rel="noopener noreferrer">
          <span>Learn more about my work experiences.</span>
        </NLink>
      </section>

      <!-- Licensing -->
      <section class="prose-section animate-in slide-in-from-bottom-2">
        <h2 class="text-xl sm:text-2xl font-700 text-gray-900 dark:text-gray-100 mb-3">
          <span class="i-ph-files mr-2"></span>
          Licensing
        </h2>
        <p class="leading-relaxed text-gray-700 dark:text-gray-300">
          All illustrations on this site are free to use under the
          <NuxtLink href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank"
            class="font-600 hover:underline transition-all duration-300"
            :class="randomColors.getTextColorClasses()">
            Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)
          </NuxtLink>
          This means you are free to share and adapt the material for any purpose, even commercially,
          as long as you give appropriate credit and share your adaptations under the same license.
        </p>
      </section>

      <!-- Connect CTA -->
      <section class="animate-in slide-in-from-bottom-2">
        <div class="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/60 dark:bg-gray-900/40 backdrop-blur p-6 sm:p-8">
          <div class="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div>
              <h3 class="text-lg sm:text-xl font-700 text-gray-900 dark:text-gray-100 mb-1">
                <span class="i-ph-handshake mr-2"></span>
                Let's connect
              </h3>
              <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-prose">
                If any of this resonates with you, I'd love to hear from you. Reach out via the contact form
                or find me on the platforms below.
              </p>
            </div>

            <div class="flex items-center gap-2 self-stretch sm:self-auto">
              <NButton btn="soft-blue" size="md" class="w-full sm:w-auto" @click="openContact">
                <span class="i-ph-paper-plane-right mr-2"></span>
                Contact me
              </NButton>
              <NLink to="/contact" class="hidden sm:inline-flex">
                <NButton btn="ghost-amber" size="md" class="">
                  Full contact page
                </NButton>
              </NLink>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <NLink to="https://github.com/rootasjey" target="_blank" rel="noopener noreferrer"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <div class="i-ph-github-logo"></div>
              <span class="font-600 text-size-3">GitHub</span>
            </NLink>
            <NLink to="https://www.instagram.com/rootasjey" target="_blank" rel="noopener noreferrer"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <div class="i-ph-instagram-logo"></div>
              <span class="font-600 text-size-3">Instagram</span>
            </NLink>
            <NLink to="https://www.linkedin.com/in/jeremiecorpinot/" target="_blank" rel="noopener noreferrer"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <div class="i-ph-linkedin-logo"></div>
              <span class="font-600 text-size-3">LinkedIn</span>
            </NLink>
          </div>
        </div>

        <!-- Success message -->
        <NAlert v-if="showSuccess" class="mt-4" color="green" variant="soft" title="Message Sent!"
          icon="i-ph-check-circle" :close-button="{ icon: 'i-ph-x', color: 'gray' }" @close="showSuccess = false">
          Thank you for reaching out. I'll get back to you as soon as possible.
        </NAlert>

        <!-- Error message -->
        <NAlert v-if="hasError" class="mt-4" color="red" variant="soft" title="Something went wrong"
          icon="i-ph-warning-circle" :close-button="{ icon: 'i-ph-x', color: 'gray' }" @close="hasError = false">
          There was an error sending your message. Please try again later or contact me directly.
        </NAlert>
      </section>
    </article>

    <!-- Desktop dialog -->
    <NDialog
      v-model:open="isContactOpen"
      :ui="{ width: 'sm:max-w-lg' }"
      class="hidden sm:block"
    >
      <div class="p-1 sm:p-2 animate-in zoom-in-95">
        <h3 class="text-xl font-700 mb-3">Send a message</h3>
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
      <NDrawerContent class="w-full max-w-[100vw] bottom-0 animate-in slide-in-from-bottom-2">
        <NDrawerHeader>
          <NDrawerTitle>Send a message</NDrawerTitle>
          <NDrawerDescription class="text-sm text-gray-500 dark:text-gray-400">I'll get back to you as soon as possible</NDrawerDescription>
        </NDrawerHeader>
        <div class="p-4">
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
        <NDrawerFooter />
      </NDrawerContent>
    </NDrawer>

    <Footer class="mt-14" />
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
