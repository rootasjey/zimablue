<template>
  <form @submit.prevent="$emit('submit')" class="space-y-4">
    <div>
      <label for="about-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Your Email <span class="text-[#EC7FA9] dark:text-[#FFB8E0]">*</span>
      </label>
      <UInput
        id="about-email"
        type="email"
        :model-value="email"
        @update:model-value="$emit('update:email', $event)"
        placeholder="your@email.com"
        required
        class="w-full"
        :ui="{
          base: 'transition duration-200',
          rounded: 'rounded-lg',
          color: { gray: { outline: 'bg-white dark:bg-gray-900 ring-1 ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400' } }
        }"
      />
    </div>

    <div>
      <label for="about-subject" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Subject <span class="text-[#EC7FA9] dark:text-[#FFB8E0]">*</span>
      </label>
      <UInput
        id="about-subject"
        type="text"
        :model-value="subject"
        @update:model-value="$emit('update:subject', $event)"
        placeholder="What's this about?"
        required
        class="w-full"
        :ui="{
          base: 'transition duration-200',
          rounded: 'rounded-lg',
          color: { gray: { outline: 'bg-white dark:bg-gray-900 ring-1 ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400' } }
        }"
      />
    </div>

    <div>
      <label for="about-message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Message <span class="text-[#EC7FA9] dark:text-[#FFB8E0]">*</span>
      </label>
      <UInput
        id="about-message"
        type="textarea"
        :model-value="message"
        @update:model-value="$emit('update:message', $event)"
        placeholder="Tell me about your project or inquiry..."
        required
        :rows="5"
        class="w-full"
        :ui="{
          base: 'transition duration-200',
          rounded: 'rounded-lg',
          color: { gray: { outline: 'bg-white dark:bg-gray-900 ring-1 ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400' } }
        }"
      />
    </div>

    <div class="pt-1">
      <UButton type="submit" :loading="loading" :disabled="loading" class="w-full sm:w-auto" btn="outline">
        <span class="i-ph-paper-plane-right mr-2"></span>
        Send Message
      </UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
defineProps<{
  email: string
  subject: string
  message: string
  loading?: boolean
}>()

defineEmits<{
  (e: 'update:email', value: string): void
  (e: 'update:subject', value: string): void
  (e: 'update:message', value: string): void
  (e: 'submit'): void
}>()
</script>
