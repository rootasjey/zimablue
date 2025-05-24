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
          About Me
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
    </header>

    <!-- Who am I -->
    <section class="mb-12">
      <h2 class="text-lg font-500 text-gray-800 dark:text-gray-200 mb-4">
        <span class="i-ph-user-circle mr-2"></span>
        Who's behind this gallery?
      </h2>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
          I'm a self-taught illustrator and software engineer based in France. My work explores the intersection of 
          technology and art, creating digital illustrations that blend technical precision with creative expression.
      </p>
      <ULink to="https://www.rootasjey.dev/resume" class="arrow" target="_blank" rel="noopener noreferrer">
        <span>Learn more about my work experiences.</span>
      </ULink>
    </section>

    <!-- Licensing -->
    <section class="mb-12">
      <h2 class="text-lg font-500 text-gray-800 dark:text-gray-200 mb-4">
        <span class="i-ph-files mr-2"></span>
        Licensing
      </h2>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        All illustrations on this site are free to use under the 
        <NuxtLink href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" 
          class="font-400 hover:underline hover:text-[#ADB2D4] transition-all duration-300"
          :class="randomLightColor">
          Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)</NuxtLink>
        This means you are free to share and adapt the material for any purpose, even commercially, 
        as long as you give appropriate credit and share your adaptations under the same license.
      </p>
    </section>

    <!-- Connect -->
    <section>
      <UCollapsible v-model:open="isFormOpen">
        
      <h2 class="text-lg font-500 text-gray-800 dark:text-gray-200 mb-4">
        <span class="i-ph-handshake mr-2"></span>
        Let's Connect
      </h2>

      <p class="text-gray-700 dark:text-gray-300 mb-6">
        If any of this resonates with you, or if you're curious to learn more about my work and perspectives, 
        I'd love to connect. You can reach out through my 
        <ULink to="/contact" class="arrow"><span>contact page</span></ULink> 
        or find me on the social platforms linked below.
      </p>

      <div class="flex flex-wrap gap-4">
        <ULink to="https://github.com/rootasjey" target="_blank" rel="noopener noreferrer" 
           class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <div class="i-ph-github-logo"></div>
          <span class="font-600 text-size-3">GitHub</span>
        </ULink>
        <ULink to="https://www.instagram.com/rootasjey" target="_blank" rel="noopener noreferrer"
           class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <div class="i-ph-instagram-logo"></div>
          <span class="font-600 text-size-3">Instagram</span>
        </ULink>
        <ULink to="https://www.linkedin.com/in/jeremiecorpinot/" target="_blank" rel="noopener noreferrer"
           class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <div class="i-ph-linkedin-logo"></div>
          <span class="font-600 text-size-3">LinkedIn</span>
        </ULink>
      </div>

        <UCollapsibleTrigger as-child>
          <UButton btn="text" size="md" class="pl-0 mt-6 mb-4" :class="randomLightColor">
            {{ isFormOpen ? "Hide contact form ☝️" : "Send a message 📮" }}
          </UButton>
        </UCollapsibleTrigger>

        <UCollapsibleContent>
          <form @submit.prevent="submitForm" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Email <span class="text-[#EC7FA9] dark:text-[#FFB8E0]">*</span>
              </label>
              <UInput
                id="email"
                v-model="formData.email"
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
              <label for="subject" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject <span class="text-[#EC7FA9] dark:text-[#FFB8E0]">*</span>
              </label>
              <UInput
                id="subject"
                v-model="formData.subject"
                type="text"
                placeholder="What's this about?"
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
              <label for="message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message <span class="text-[#EC7FA9] dark:text-[#FFB8E0]">*</span>
              </label>
              <UInput
                id="message"
                type="textarea"
                v-model="formData.message"
                placeholder="Tell me about your project or inquiry..."
                required
                :rows="5"
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
              <UButton
                type="submit"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                class="w-full sm:w-auto"
                btn="outline"
              >
                <span class="i-ph-paper-plane-right mr-2"></span>
                Send Message
              </UButton>
            </div>
          </form>
        </UCollapsibleContent>
      </UCollapsible>
      
      <!-- Success message -->
      <UAlert
        v-if="showSuccess"
        class="mt-4"
        color="green"
        variant="soft"
        title="Message Sent!"
        icon="i-ph-check-circle"
        :close-button="{ icon: 'i-ph-x', color: 'gray' }"
        @close="showSuccess = false"
      >
        Thank you for reaching out. I'll get back to you as soon as possible.
      </UAlert>
      
      <!-- Error message -->
      <UAlert
        v-if="hasError"
        class="mt-4"
        color="red"
        variant="soft"
        title="Something went wrong"
        icon="i-ph-warning-circle"
        :close-button="{ icon: 'i-ph-x', color: 'gray' }"
        @close="hasError = false"
      >
        There was an error sending your message. Please try again later or contact me directly.
      </UAlert>
    </section>

    <Footer />
  </div>
</template>

<script lang="ts" setup>
const { toast } = useToast()

// Define your color palettes
const lightModeColors = [
  'text-[#EC7FA9]',
  'text-[#FF6B6B]',
  'text-[#48A9A6]',
  'text-[#9370DB]',
  'text-[#4A90E2]',
  'text-[#F7B801]'
]

const darkModeColors = [
  'dark:text-[#66D2CE]',
  'dark:text-[#FF9E9E]',
  'dark:text-[#7FDBDA]',
  'dark:text-[#B19CD9]',
  'dark:text-[#7FB3F1]',
  'dark:text-[#FFD54F]'
]

// Use useState to ensure the same random index is used on server and client
const colorIndex = useState('colorIndex', () => Math.floor(Math.random() * lightModeColors.length))
const darkColorIndex = useState('darkColorIndex', () => Math.floor(Math.random() * darkModeColors.length))

// Function to get a random color from an array
const getRandomColor = (colors: string[]) => {
  const randomIndex = Math.floor(Math.random() * colors.length)
  return colors[randomIndex]
}

// Computed properties for consistent colors
const randomLightColor = computed(() => {
  const lightColor = lightModeColors[colorIndex.value]
  const darkColor = darkModeColors[darkColorIndex.value]
  return `${lightColor} ${darkColor}`
})

const formData = reactive({
  email: '',
  subject: '',
  message: ''
})

const isSubmitting = ref(false)
const showSuccess = ref(false)
const hasError = ref(false)
const isFormOpen = ref(false)

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

const greeting = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 22) return 'Good evening'
  return 'Good night'
})

const timeIcon = computed(() => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'i-ph-sun-horizon'
  if (hour >= 12 && hour < 17) return 'i-line-md:moon-to-sunny-outline-loop-transition'
  if (hour >= 17 && hour < 22) return 'i-ph:sun-horizon-bold'
  return 'i-line-md:moon-rising-twotone-loop'
})
</script>

<style scoped>
.frame {
  width: 600px;
  border-radius: 0.75rem;
  padding: 2rem;
  padding-bottom: 38vh;
  display: flex;
  flex-direction: column;
  transition-property: all;
  transition-duration: 500ms;
  overflow-y: auto;
}

.i-ph-sun-horizon,
.i-line-md\:moon-to-sunny-outline-loop-transition {
  animation: fadeScale 0.3s ease-in-out;
}

@keyframes fadeScale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
