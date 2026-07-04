<template>
  <main class="max-w-6xl mx-auto py-16 sm:py-24 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-1000">
    <header class="mb-20 sm:mb-24">
      <h1 class="text-4xl sm:text-5xl md:text-7xl font-900 tracking-tighter text-gray-900 dark:text-gray-100 mb-4">
        Developers
      </h1>
      <p class="text-lg text-gray-400 dark:text-gray-500 max-w-2xl font-body">
        API keys, integration guides, and reference documentation for building with Zima Blue.
      </p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
      <!-- Section Navigation -->
      <aside class="lg:col-span-3 space-y-1 sticky top-32 lg:block hidden">
        <NuxtLink
          to="/developers"
          class="flex items-center gap-2 w-full text-left px-4 py-3 rounded-2xl transition-all text-sm font-600"
          :class="$route.path === '/developers'
            ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-800 shadow-sm'
            : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'"
        >
          <span class="i-ph-key"></span>
          API Keys
        </NuxtLink>
        <NuxtLink
          to="/developers/api-reference"
          class="flex items-center gap-2 w-full text-left px-4 py-3 rounded-2xl transition-all text-sm font-600"
          :class="$route.path.startsWith('/developers/api-reference')
            ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-800 shadow-sm'
            : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'"
        >
          <span class="i-ph-flask"></span>
          Playground
        </NuxtLink>
      </aside>

      <section class="lg:col-span-9 space-y-16 sm:space-y-24">
        <div class="animate-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div v-if="!loggedIn" class="text-center py-16">
            <span class="i-ph-key-duotone text-5xl text-gray-300 dark:text-gray-600 mb-4 block"></span>
            <h2 class="text-xl font-700 text-gray-500 dark:text-gray-400 mb-2">Sign in to manage API keys</h2>
            <p class="text-gray-400 dark:text-gray-500 mb-6 font-body">You need to be logged in to create and manage API tokens.</p>
            <NButton btn="solid-blue" to="/login">Sign in</NButton>
          </div>

          <div v-else>
            <div class="flex items-center justify-between mb-8">
              <div>
                <h2 class="text-2xl font-900 text-gray-900 dark:text-gray-100 tracking-tight">API Keys</h2>
                <p class="text-gray-400 dark:text-gray-500 font-body mt-1">Tokens used to authenticate requests to the Zima Blue API.</p>
              </div>
              <NButton btn="solid-blue" @click="showCreateDialog = true">
                <span class="i-ph-plus mr-1"></span>
                Create key
              </NButton>
            </div>

            <div v-if="isLoadingTokens" class="flex items-center justify-center py-12">
              <span class="i-ph-spinner animate-spin text-2xl text-gray-400"></span>
            </div>

            <div v-else-if="tokens.length === 0" class="rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
              <span class="i-ph-key-duotone text-4xl text-gray-300 dark:text-gray-600 mb-4 block"></span>
              <p class="text-gray-500 dark:text-gray-400 font-body mb-2">No API keys yet.</p>
              <p class="text-sm text-gray-400 dark:text-gray-500 font-body">Create your first key to start building with the API.</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="token in tokens"
                :key="token.id"
                class="rounded-[1.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 sm:p-6 flex items-center justify-between gap-4 shadow-sm"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-700 text-gray-900 dark:text-gray-100">{{ token.name }}</span>
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-wider"
                      :class="isExpired(token.expires_at)
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'"
                    >
                      {{ isExpired(token.expires_at) ? 'Expired' : 'Active' }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500 font-body">
                    <span>Created {{ formatDate(token.created_at) }}</span>
                    <span v-if="token.expires_at">Expires {{ formatDate(token.expires_at) }}</span>
                    <span v-if="token.last_used_at">Last used {{ formatDate(token.last_used_at) }}</span>
                    <span v-else>Never used</span>
                  </div>
                </div>
                <NButton
                  btn="soft-red"
                  size="sm"
                  @click="confirmRevoke(token)"
                >
                  Revoke
                </NButton>
              </div>
            </div>
          </div>
        </div>

      </section>
    </div>

    <!-- Create Token Dialog -->
    <NDialog v-model:open="showCreateDialog">
      <NDialogContent class="sm:max-w-md">
        <NDialogHeader>
          <NDialogTitle>Create API key</NDialogTitle>
          <NDialogDescription>
            Give your key a name so you can identify it later. The full token will be shown only once.
          </NDialogDescription>
        </NDialogHeader>

        <form @submit.prevent="handleCreate" class="space-y-4 py-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <NInput
              v-model="newTokenName"
              placeholder="My app"
              required
              maxlength="100"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Expiration</label>
            <select
              v-model="newTokenExpiry"
              class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
            >
              <option :value="0">Never expires</option>
              <option :value="7">7 days</option>
              <option :value="30">30 days</option>
              <option :value="90">90 days</option>
              <option :value="365">1 year</option>
            </select>
          </div>

          <div v-if="createError" class="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-600 dark:text-red-400">
            {{ createError }}
          </div>

          <NDialogFooter>
            <NButton btn="soft-gray" @click="showCreateDialog = false">Cancel</NButton>
            <NButton btn="solid-blue" type="submit" :loading="isCreating">
              Create key
            </NButton>
          </NDialogFooter>
        </form>
      </NDialogContent>
    </NDialog>

    <!-- Token Created Dialog -->
    <NDialog v-model:open="showTokenDialog">
      <NDialogContent class="sm:max-w-md">
        <NDialogHeader>
          <NDialogTitle>API key created</NDialogTitle>
          <NDialogDescription>
            Copy this token now. You won't be able to see it again.
          </NDialogDescription>
        </NDialogHeader>

        <div class="py-4">
          <div class="relative">
            <pre class="p-4 rounded-xl bg-gray-900 text-green-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all select-all">{{ createdToken }}</pre>
            <button
              class="absolute top-2 right-2 p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
              @click="copyToken"
              :title="copied ? 'Copied!' : 'Copy to clipboard'"
            >
              <span :class="copied ? 'i-ph-check-circle text-green-400' : 'i-ph-copy-simple'"></span>
            </button>
          </div>
        </div>

        <NDialogFooter>
          <NButton btn="solid-blue" @click="showTokenDialog = false; copied = false">Done</NButton>
        </NDialogFooter>
      </NDialogContent>
    </NDialog>

    <!-- Revoke Confirmation Dialog -->
    <NDialog v-model:open="showRevokeDialog">
      <NDialogContent>
        <NDialogHeader>
          <NDialogTitle>Revoke API key</NDialogTitle>
          <NDialogDescription>
            Are you sure you want to revoke <strong>{{ tokenToRevoke?.name }}</strong>?
            Any application using this key will immediately lose access.
          </NDialogDescription>
        </NDialogHeader>
        <NDialogFooter>
          <NButton btn="soft-gray" @click="showRevokeDialog = false">Cancel</NButton>
          <NButton btn="soft-red" @click="handleRevoke">Revoke</NButton>
        </NDialogFooter>
      </NDialogContent>
    </NDialog>

    <Footer class="mt-32 grayscale opacity-10" />
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { loggedIn } = useUserSession()
const { toast } = useToast()
const { showErrorToast } = useErrorToast()

// ─── Token Management ─────────────────────────────────

const tokens = ref<any[]>([])
const isLoadingTokens = ref(false)

function isExpired(date: string | null): boolean {
  if (!date) return false
  return new Date(date).getTime() < Date.now()
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function fetchTokens() {
  isLoadingTokens.value = true
  try {
    const res = await $fetch<any>('/api/api-tokens')
    tokens.value = res.data || []
  } catch (e) {
    tokens.value = []
  } finally {
    isLoadingTokens.value = false
  }
}

// Create
const showCreateDialog = ref(false)
const newTokenName = ref('')
const newTokenExpiry = ref(0)
const isCreating = ref(false)
const createError = ref('')

async function handleCreate() {
  if (!newTokenName.value.trim()) return
  isCreating.value = true
  createError.value = ''
  try {
    const res = await $fetch<any>('/api/api-tokens', {
      method: 'POST',
      body: {
        name: newTokenName.value.trim(),
        expiresInDays: newTokenExpiry.value > 0 ? newTokenExpiry.value : undefined,
      },
    })
    showCreateDialog.value = false
    newTokenName.value = ''
    newTokenExpiry.value = 0
    createdToken.value = res.data.token
    showTokenDialog.value = true
    fetchTokens()
  } catch (e: any) {
    createError.value = e?.data?.message || 'Failed to create token. Please try again.'
  } finally {
    isCreating.value = false
  }
}

// Show created token
const showTokenDialog = ref(false)
const createdToken = ref('')
const copied = ref(false)

async function copyToken() {
  try {
    await navigator.clipboard.writeText(createdToken.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback
  }
}

// Revoke
const showRevokeDialog = ref(false)
const tokenToRevoke = ref<any>(null)

function confirmRevoke(token: any) {
  tokenToRevoke.value = token
  showRevokeDialog.value = true
}

async function handleRevoke() {
  if (!tokenToRevoke.value) return
  try {
    await $fetch(`/api/api-tokens/${tokenToRevoke.value.id}`, { method: 'DELETE' })
    showRevokeDialog.value = false
    tokenToRevoke.value = null
    fetchTokens()
  } catch (e: any) {
    showErrorToast(e, 'Error', 'Failed to revoke token.')
  }
}



onMounted(() => {
  if (loggedIn.value) {
    fetchTokens()
  }
})
</script>
