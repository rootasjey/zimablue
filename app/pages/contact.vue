<template>
  <main class="contact-page mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
    <header class="relative overflow-hidden border-b border-gray-100 pb-12 dark:border-gray-800 sm:pb-16">
      <div class="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/8"></div>
      <div class="relative max-w-4xl">
        <div class="mb-8 flex items-center gap-3 text-[10px] font-800 uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">
          <span class="h-px w-10 bg-cyan-400"></span>
          Open channel
          <span class="text-gray-300 dark:text-gray-700">/</span>
          01
        </div>
        <h1 class="max-w-4xl text-5xl font-900 tracking-[-0.06em] text-gray-900 dark:text-gray-100 sm:text-7xl lg:text-8xl">
          Let's make room
          <span class="block font-body font-400 italic text-cyan-600 dark:text-cyan-300">for a good idea.</span>
        </h1>
        <p class="mt-8 max-w-xl text-lg leading-relaxed text-gray-500 dark:text-gray-400 sm:text-xl">
          Collaborations, questions, commissions, or just a hello from somewhere out there.
          The signal is open.
        </p>
      </div>
    </header>

    <section class="grid gap-12 py-12 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24 lg:py-20">
      <div class="flex flex-col justify-between gap-12">
        <div>
          <p class="mb-5 text-xs font-800 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Prefer a direct line?</p>
          <a
            href="mailto:support@zimablue.cc"
            class="group inline-flex max-w-full items-center gap-3 text-lg font-700 text-gray-900 transition-colors hover:text-cyan-600 dark:text-gray-100 dark:hover:text-cyan-300 sm:text-xl"
          >
            <span class="i-ph-envelope-simple-open text-cyan-500 transition-transform group-hover:-rotate-6"></span>
            <span class="truncate">support@zimablue.cc</span>
            <span class="i-ph-arrow-up-right text-sm text-gray-300 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 dark:text-gray-600"></span>
          </a>
          <p class="mt-4 max-w-xs text-sm leading-relaxed text-gray-400 dark:text-gray-500">
            I read everything that comes through here and will get back to you as soon as I can.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-5 border-t border-dashed border-gray-200 pt-6 text-sm dark:border-gray-800">
          <div>
            <p class="mb-2 text-[10px] font-800 uppercase tracking-[0.18em] text-gray-400 dark:text-gray-600">Based in</p>
            <p class="text-gray-700 dark:text-gray-300">France, CET</p>
          </div>
          <div>
            <p class="mb-2 text-[10px] font-800 uppercase tracking-[0.18em] text-gray-400 dark:text-gray-600">Topics</p>
            <p class="text-gray-700 dark:text-gray-300">Art · Code · Ideas</p>
          </div>
        </div>
      </div>

      <div class="relative rounded-[2rem] border border-gray-100 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(8,145,178,0.35)] dark:border-gray-800 dark:bg-gray-900 sm:p-10">
        <div class="absolute right-8 top-8 text-[10px] font-800 uppercase tracking-[0.2em] text-gray-300 dark:text-gray-700">Transmit</div>
        <div class="mb-8 max-w-md">
          <h2 class="text-3xl font-900 tracking-tight text-gray-900 dark:text-gray-100">Send a message</h2>
          <p class="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">A few lines are enough. Include links if they help tell the story.</p>
        </div>

        <AboutContactForm
          :email="form.email"
          :subject="form.subject"
          :message="form.message"
          :loading="submitting"
          @update:email="form.email = $event"
          @update:subject="form.subject = $event"
          @update:message="form.message = $event"
          @submit="handleSubmit"
        />

        <div v-if="submitted" class="mt-6 flex items-start gap-3 rounded-2xl bg-cyan-50 p-4 text-sm text-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-100">
          <span class="i-ph-check-circle-fill mt-0.5 text-cyan-500"></span>
          <p>Message received. Thanks for reaching out, I'll get back to you soon.</p>
        </div>
        <p v-if="formStatus?.type === 'error'" class="mt-5 text-sm text-red-500">{{ formStatus.message }}</p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import AboutContactForm from '~/components/about/AboutContactForm.vue'

useSeoMeta({
  title: 'Contact',
  description: 'Get in touch — collaborations, enquiries, or just a hello',
  ogTitle: 'Contact — Zima Blue',
  ogDescription: 'Get in touch with the creator behind Zima Blue',
  twitterTitle: 'Contact — Zima Blue',
  twitterDescription: 'Get in touch with the creator behind Zima Blue',
})

defineOgImageComponent('Default.takumi', {
  title: 'Get in Touch',
  description: 'Collaborations, enquiries, or just a hello',
}, {
  fonts: [
    { name: 'Caprasimo', path: '/fonts/Caprasimo-Regular.ttf', weight: 400, style: 'normal' },
  ],
})

const form = reactive({ email: '', subject: '', message: '' })
const submitting = ref(false)
const submitted = ref(false)
const formStatus = ref<{ type: 'error'; message: string } | null>(null)

async function handleSubmit() {
  submitting.value = true
  submitted.value = false
  formStatus.value = null

  try {
    const response = await $fetch('/api/contact/submit', {
      method: 'POST',
      body: form,
    })

    if (!response.success) throw new Error(response.message || 'Failed to send message')

    form.email = ''
    form.subject = ''
    form.message = ''
    submitted.value = true
  } catch (error) {
    console.error('Error submitting contact form:', error)
    formStatus.value = { type: 'error', message: 'Failed to send your message. Please try again later.' }
  } finally {
    submitting.value = false
  }
}
</script>
