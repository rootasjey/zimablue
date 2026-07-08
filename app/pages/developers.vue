<template>
  <main class="max-w-6xl mx-auto py-16 sm:py-24 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-1000">
    <header class="mb-20 sm:mb-24">
      <h1 class="text-4xl sm:text-5xl md:text-7xl font-900 tracking-tighter text-gray-900 dark:text-gray-100 mb-4">
        Developers
      </h1>
      <p class="text-lg text-gray-400 dark:text-gray-500 max-w-2xl font-body">
        API keys and reference documentation for building with Zima Blue.
      </p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
      <!-- Section Navigation -->
      <aside class="lg:col-span-3 space-y-1 sticky top-32 lg:block hidden">
        <button
          class="flex items-center gap-2 w-full text-left px-4 py-3 rounded-2xl transition-all text-sm font-600"
          :class="activeTab === 'reference'
            ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-800 shadow-sm'
            : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'"
          @click="navigateTo({ query: { tab: 'reference' } })"
        >
          <span class="i-ph-book-open-text"></span>
          API Reference
        </button>
        <button
          class="flex items-center gap-2 w-full text-left px-4 py-3 rounded-2xl transition-all text-sm font-600"
          :class="activeTab === 'keys'
            ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-800 shadow-sm'
            : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'"
          @click="navigateTo({ query: { tab: 'keys' } })"
        >
          <span class="i-ph-key"></span>
          API Keys
        </button>
        <button
          class="flex items-center gap-2 w-full text-left px-4 py-3 rounded-2xl transition-all text-sm font-600"
          :class="activeTab === 'playground'
            ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-800 shadow-sm'
            : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'"
          @click="navigateTo({ query: { tab: 'playground' } })"
        >
          <span class="i-ph-terminal-window"></span>
          Playground
        </button>
      </aside>

      <section class="lg:col-span-9 space-y-16 sm:space-y-24">
        <!-- API Keys -->
        <div v-if="activeTab === 'keys'" class="animate-in slide-in-from-bottom-8 duration-1000 delay-200">
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
              <WarmZebraButton @click="showCreateDialog = true">
                <span class="i-ph-plus"></span>
                Create key
              </WarmZebraButton>
            </div>

            <div v-if="isLoadingTokens" class="flex items-center justify-center py-12">
              <span class="i-ph-spinner animate-spin text-2xl text-gray-400"></span>
            </div>

            <div v-else-if="tokens.length === 0" class="rounded-6 border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
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
                      :class="token.revoked
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : isExpired(token.expires_at)
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'"
                    >
                      {{ token.revoked ? 'Revoked' : isExpired(token.expires_at) ? 'Expired' : 'Active' }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500 font-body">
                    <span>Created {{ formatDate(token.created_at) }}</span>
                    <span v-if="token.expires_at">Expires {{ formatDate(token.expires_at) }}</span>
                    <span v-if="token.last_used_at">Last used {{ formatDate(token.last_used_at) }}</span>
                    <span v-else>Never used</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <NButton
                    v-if="!token.revoked"
                    btn="soft-gray"
                    size="sm"
                    @click="confirmEdit(token)"
                  >
                    Edit
                  </NButton>
                  <NButton
                    v-if="!token.revoked"
                    btn="soft-red"
                    size="sm"
                    @click="confirmRevoke(token)"
                  >
                    Revoke
                  </NButton>
                  <NButton
                    v-if="token.revoked"
                    btn="soft-blue"
                    size="sm"
                    @click="handleActivate(token)"
                  >
                    Activate
                  </NButton>
                  <NButton
                    v-if="token.revoked"
                    btn="soft-red"
                    size="sm"
                    @click="confirmDelete(token)"
                  >
                    Delete
                  </NButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- API Reference -->
        <div v-if="activeTab === 'reference'" class="animate-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center">
              <span class="i-ph-book-open-text text-2xl text-emerald-500/50"></span>
            </div>
            <h2 class="text-2xl font-900 text-gray-900 dark:text-gray-100 tracking-tight">API Reference</h2>
          </div>

          <div class="rounded-6 border border-gray-100 dark:border-gray-800 p-10 sm:p-14 bg-white dark:bg-gray-950 mb-8">
            <p class="text-sm text-gray-400 dark:text-gray-500 font-body mb-4">Base URL</p>
            <code class="text-sm text-gray-900 dark:text-gray-100 font-mono">https://zimablue.com/api</code>
          </div>

          <div class="mb-6">
            <NInput
              v-model="referenceSearch"
              placeholder="Search endpoints…"
            >
              <template #leading>
                <span class="i-ph-magnifying-glass text-gray-400"></span>
              </template>
            </NInput>
          </div>

          <div v-if="filteredApiGroups.length === 0" class="rounded-6 border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
            <span class="i-ph-magnifying-glass-duotone text-4xl text-gray-300 dark:text-gray-600 mb-4 block"></span>
            <p class="text-gray-500 dark:text-gray-400 font-body">
              No endpoints match <strong class="text-gray-700 dark:text-gray-300">"{{ referenceSearch }}"</strong>.
            </p>
          </div>

          <div v-else class="space-y-6">
            <div v-for="group in filteredApiGroups" :key="group.label" class="rounded-6 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 sm:p-8 shadow-sm">
              <h3 class="text-lg font-800 text-gray-900 dark:text-gray-100 mb-1">{{ group.label }}</h3>
              <p class="text-sm text-gray-400 dark:text-gray-500 font-body mb-5">{{ group.description }}</p>

              <div v-for="endpoint in group.endpoints" :key="endpoint.method + endpoint.path" class="flex items-start gap-4 py-3 border-t border-gray-50 dark:border-gray-800/50 first:border-t-0 first:pt-0">
                <span
                  class="shrink-0 mt-0.5 px-2 py-0.5 rounded text-[11px] font-800 uppercase tracking-wider"
                  :class="methodClass(endpoint.method)"
                >
                  {{ endpoint.method }}
                </span>
                <div class="min-w-0 flex-1">
                  <code class="text-sm text-gray-800 dark:text-gray-200 font-mono">{{ endpoint.path }}</code>
                  <p class="text-xs text-gray-400 dark:text-gray-500 font-body mt-0.5">{{ endpoint.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- API Playground -->
        <div v-if="activeTab === 'playground'" class="animate-in slide-in-from-bottom-8 duration-1000 delay-400">
          <div class="flex items-center gap-4 mb-8">
            <div class="w-10 h-10 rounded-xl bg-violet-500/5 flex items-center justify-center">
              <span class="i-ph-terminal-window text-2xl text-violet-500/50"></span>
            </div>
            <h2 class="text-2xl font-900 text-gray-900 dark:text-gray-100 tracking-tight">API Playground</h2>
          </div>

          <div class="rounded-6 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 sm:p-8 shadow-sm">
            <!-- Endpoint selector -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Endpoint</label>
              <NCombobox
                v-model="playground.selectedEndpoint"
                :items="playground.getEndpoints"
                by="path"
                label-key="path"
                value-key="path"
                :_combobox-input="{
                  placeholder: 'Search endpoints…',
                  autocomplete: 'off',
                }"
                :_combobox-list="{
                  class: 'w-full',
                  align: 'start',
                }"
                class="w-full"
              >
                <template #trigger="{ modelValue }">
                  <template v-if="modelValue">
                    <span
                      class="shrink-0 px-2 py-0.5 rounded text-[11px] font-800 uppercase tracking-wider"
                      :class="methodClass(modelValue.method)"
                    >
                      {{ modelValue.method }}
                    </span>
                    <span class="font-mono text-sm text-gray-900 dark:text-gray-100">{{ modelValue.path }}</span>
                  </template>
                  <span v-else class="text-gray-400">Select an endpoint…</span>
                </template>
                <template #item="{ item }">
                  <span
                    class="shrink-0 px-2 py-0.5 rounded text-[11px] font-800 uppercase tracking-wider"
                    :class="methodClass(item.method)"
                  >
                    {{ item.method }}
                  </span>
                  <span class="font-mono text-sm">{{ item.path }}</span>
                </template>
              </NCombobox>
              <p v-if="playground.selectedEndpoint" class="text-xs text-gray-400 dark:text-gray-500 font-body mt-1.5">
                {{ playground.selectedEndpoint.description }}
              </p>
            </div>

            <!-- Slug parameter -->
            <div v-if="playground.needsSlug" class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Slug</label>
              <NInput
                v-model="playground.slugParam"
                placeholder="Enter the slug…"
              />
            </div>

            <!-- ID parameter -->
            <div v-if="playground.needsId" class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image ID</label>
              <NInput
                v-model="playground.idParam"
                type="number"
                placeholder="Enter the image ID…"
              />
            </div>

            <!-- Query parameters -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Query parameters <span class="text-gray-400 font-normal">(optional)</span></label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="param in playground.availableParams"
                  :key="param.key"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-600 border transition-colors"
                  :class="playground.isParamActive(param.key)
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                    : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                  :title="playground.isParamActive(param.key) ? `Click to edit ${param.key}` : `Click to add ${param.key}`"
                  @click="playground.toggleParam(param.key, param.defaultValue)"
                >
                  <template v-if="playground.isParamActive(param.key)">
                    <span>{{ param.key }} </span>
                    <span
                      class="font-700 underline underline-offset-2 decoration-dotted cursor-pointer hover:text-indigo-500"
                      @click.stop="openParamEdit(param.key)"
                    >
                      {{ playground.getParamValue(param.key) || '…' }}
                    </span>
                    <span class="i-ph-x text-xs ml-0.5 opacity-50 hover:opacity-100" @click.stop="playground.removeParam(param.key)"></span>
                  </template>
                  <template v-else>
                    {{ param.key }}
                  </template>
                </button>
                <button
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-600 border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 transition-colors"
                  @click="showCustomParamDialog = true"
                >
                  <span class="i-ph-plus text-xs"></span>
                  Custom
                </button>
              </div>
              <p v-if="playground.queryString" class="text-xs text-gray-400 dark:text-gray-500 font-body mt-2">
                Query: <code class="text-xs text-emerald-600 dark:text-emerald-400">{{ playground.queryString }}</code>
              </p>
            </div>

            <!-- API Key -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">API Key <span class="text-gray-400 font-normal">(optional)</span></label>
              <NInput
                v-model="playground.apiKey"
                placeholder="Paste your API key…"
                type="password"
              >
                <template #trailing>
                  <NButton
                    v-if="!playground.apiKey"
                    btn="light:soft-primary dark:soft-gray"
                    size="xs"
                    trailing="i-ph-plus-bold"
                    class="pointer-events-auto cursor-pointer shrink-0 text-xs font-600 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    @click="handleCreateKeyFromPlayground"
                  >
                    Create
                  </NButton>
                </template>
              </NInput>
              <p v-if="playground.apiKey" class="text-xs text-green-600 dark:text-green-400 font-body mt-1">
                <span class="i-ph-check-circle mr-1 inline-block align-text-bottom"></span>
                Key provided — requests will be authenticated.
              </p>
              <p v-else class="text-xs text-gray-400 dark:text-gray-500 font-body mt-1">
                No API key yet —
                <button
                  class="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2 transition-colors"
                  @click="handleCreateKeyFromPlayground"
                >create one</button>
                to authenticate requests.
              </p>
            </div>

            <!-- Request URL preview -->
            <div v-if="playground.fullUrl" class="mb-6 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <p class="text-[11px] font-600 uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Request URL</p>
              <code class="text-sm text-emerald-600 dark:text-emerald-400 font-mono break-all">{{ playground.fullUrl }}</code>
            </div>

            <!-- Send button -->
            <WarmZebraButton
              :disabled="!playground.selectedEndpoint"
              @click="playground.send()"
            >
              <span class="i-ph-play-fill mr-1"></span>
              Send Request
            </WarmZebraButton>

            <!-- Error -->
            <div v-if="playground.sendError" class="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-600 dark:text-red-400 font-mono">
              {{ playground.sendError }}
            </div>

            <!-- Response: image -->
            <div v-if="playground.responseImageUrl" class="mt-6">
              <p class="text-[11px] font-600 uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Response (image)</p>
              <div class="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <img
                  :src="playground.responseImageUrl"
                  alt="API response image"
                  class="max-w-full h-auto mx-auto"
                />
              </div>
            </div>

            <!-- Response: JSON / text -->
            <div v-if="playground.responseData" class="mt-6">
              <div class="flex items-center justify-between mb-2">
                <p class="text-[11px] font-600 uppercase tracking-wider text-gray-400 dark:text-gray-500">Response</p>
                <button
                  class="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
                  @click="copyResponse"
                >
                  <span :class="responseCopied ? 'i-ph-check-circle text-green-500' : 'i-ph-copy-simple'"></span>
                  {{ responseCopied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <pre
                class="p-4 rounded-xl bg-gray-900 text-xs leading-relaxed font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto"
              ><code v-html="highlightJson(playground.responseData)"></code></pre>
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
            <div class="flex gap-2">
              <NButton btn="link-gray" @click="showCreateDialog = false">Cancel</NButton>
              <WarmZebraButton type="submit" size="sm" :loading="isCreating">
                <span v-if="isCreating" class="i-ph-spinner animate-spin"></span>
                Create key
              </WarmZebraButton>
            </div>
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
            You can activate it again later.
          </NDialogDescription>
        </NDialogHeader>
        <NDialogFooter>
          <NButton btn="soft-gray" @click="showRevokeDialog = false">Cancel</NButton>
          <NButton btn="soft-red" @click="handleRevoke">Revoke</NButton>
        </NDialogFooter>
      </NDialogContent>
    </NDialog>

    <!-- Delete Confirmation Dialog -->
    <NDialog v-model:open="showDeleteDialog">
      <NDialogContent>
        <NDialogHeader>
          <NDialogTitle>Delete API key</NDialogTitle>
          <NDialogDescription>
            Are you sure you want to permanently delete <strong>{{ tokenToDelete?.name }}</strong>?
            This action cannot be undone.
          </NDialogDescription>
        </NDialogHeader>
        <NDialogFooter>
          <NButton btn="soft-gray" @click="showDeleteDialog = false">Cancel</NButton>
          <NButton btn="soft-red" @click="handleDelete">Delete</NButton>
        </NDialogFooter>
      </NDialogContent>
    </NDialog>

    <!-- Edit Token Dialog -->
    <NDialog v-model:open="showEditDialog">
      <NDialogContent class="sm:max-w-md">
        <NDialogHeader>
          <NDialogTitle>Edit API key</NDialogTitle>
          <NDialogDescription>
            Rename <strong>{{ editToken?.name }}</strong>.
          </NDialogDescription>
        </NDialogHeader>

        <form @submit.prevent="handleEdit" class="space-y-4 py-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <NInput
              v-model="editTokenName"
              placeholder="My app"
              required
              maxlength="100"
            />
          </div>

          <div v-if="editError" class="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-600 dark:text-red-400">
            {{ editError }}
          </div>

          <NDialogFooter>
            <div class="flex gap-2">
              <NButton btn="link-gray" @click="showEditDialog = false">Cancel</NButton>
              <WarmZebraButton type="submit" size="sm" :loading="isEditing">
                Save
              </WarmZebraButton>
            </div>
          </NDialogFooter>
        </form>
      </NDialogContent>
    </NDialog>

    <!-- Param Edit Dialog -->
    <NDialog v-model:open="showParamEditDialog">
      <NDialogContent class="sm:max-w-sm">
        <NDialogHeader>
          <NDialogTitle>Edit parameter</NDialogTitle>
        </NDialogHeader>
        <div class="space-y-4 py-4" @keydown="handleParamEditKeydown">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Key</label>
            <NInput :model-value="editingParamKey" disabled />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Value</label>
            <NNumberField
              v-if="isEditingNumeric"
              :model-value="Number(editingParamValue)"
              @update:model-value="v => editingParamValue = String(v ?? 0)"
              :min="0"
              :step="1"
              class="w-full"
            />
            <NInput v-else v-model="editingParamValue" placeholder="Enter value…" />
          </div>
        </div>
        <NDialogFooter>
          <NButton btn="soft-gray" @click="showParamEditDialog = false">Cancel</NButton>
          <NButton btn="solid-blue" @click="saveParamEdit">Save</NButton>
        </NDialogFooter>
      </NDialogContent>
    </NDialog>

    <!-- Custom Param Dialog -->
    <NDialog v-model:open="showCustomParamDialog">
      <NDialogContent class="sm:max-w-sm">
        <NDialogHeader>
          <NDialogTitle>Add custom parameter</NDialogTitle>
        </NDialogHeader>
        <div class="space-y-4 py-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Key</label>
            <NInput v-model="customParamKey" placeholder="e.g. sort" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Value</label>
            <NInput v-model="customParamValue" placeholder="e.g. desc" />
          </div>
        </div>
        <NDialogFooter>
          <NButton btn="soft-gray" @click="showCustomParamDialog = false; customParamKey = ''; customParamValue = ''">Cancel</NButton>
          <NButton btn="solid-blue" @click="saveCustomParam">Add</NButton>
        </NDialogFooter>
      </NDialogContent>
    </NDialog>

  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const activeTab = computed(() => (route.query.tab as string) || 'keys')

const { loggedIn } = useUserSession()
const { toast } = useToast()
const { showErrorToast } = useErrorToast()
const playground = reactive(useApiPlayground())

function handleCreateKeyFromPlayground() {
  if (!loggedIn.value) {
    navigateTo('/login')
    return
  }
  showCreateDialog.value = true
}

// ─── Param edit dialogs ───────────────────────────────

const showParamEditDialog = ref(false)
const editingParamKey = ref('')
const editingParamValue = ref('')
const isEditingNumeric = computed(() => /^-?\d+$/.test(editingParamValue.value))

function openParamEdit(key: string) {
  editingParamKey.value = key
  editingParamValue.value = playground.getParamValue(key)
  showParamEditDialog.value = true
}

function handleParamEditKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    saveParamEdit()
    return
  }
  if (e.key === 'Enter' && !e.shiftKey && e.target instanceof HTMLInputElement && !(e.target as HTMLInputElement).disabled) {
    e.preventDefault()
    saveParamEdit()
  }
}

function saveParamEdit() {
  playground.setParamValue(editingParamKey.value, editingParamValue.value)
  showParamEditDialog.value = false
}

const showCustomParamDialog = ref(false)
const customParamKey = ref('')
const customParamValue = ref('')

function saveCustomParam() {
  if (!customParamKey.value.trim()) return
  playground.setParamValue(customParamKey.value.trim(), customParamValue.value)
  showCustomParamDialog.value = false
  customParamKey.value = ''
  customParamValue.value = ''
}

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
    playground.apiKey = res.data.token
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

// Playground response copy
const responseCopied = ref(false)

async function copyResponse() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(playground.responseData, null, 2))
    responseCopied.value = true
    setTimeout(() => { responseCopied.value = false }, 2000)
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
    await $fetch(`/api/api-tokens/${tokenToRevoke.value.id}/revoke`, { method: 'POST' })
    showRevokeDialog.value = false
    tokenToRevoke.value = null
    fetchTokens()
  } catch (e: any) {
    showErrorToast(e, 'Error', 'Failed to revoke token.')
  }
}

// Activate
async function handleActivate(token: any) {
  try {
    await $fetch(`/api/api-tokens/${token.id}/activate`, { method: 'POST' })
    fetchTokens()
  } catch (e: any) {
    showErrorToast(e, 'Error', 'Failed to activate token.')
  }
}

// Delete
const showDeleteDialog = ref(false)
const tokenToDelete = ref<any>(null)

function confirmDelete(token: any) {
  tokenToDelete.value = token
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!tokenToDelete.value) return
  try {
    await $fetch(`/api/api-tokens/${tokenToDelete.value.id}`, { method: 'DELETE' })
    showDeleteDialog.value = false
    tokenToDelete.value = null
    fetchTokens()
  } catch (e: any) {
    showErrorToast(e, 'Error', 'Failed to delete token.')
  }
}

// Edit
const showEditDialog = ref(false)
const editToken = ref<any>(null)
const editTokenName = ref('')
const editError = ref('')
const isEditing = ref(false)

function confirmEdit(token: any) {
  editToken.value = token
  editTokenName.value = token.name
  editError.value = ''
  showEditDialog.value = true
}

async function handleEdit() {
  if (!editToken.value || !editTokenName.value.trim()) return
  isEditing.value = true
  editError.value = ''
  try {
    await $fetch(`/api/api-tokens/${editToken.value.id}`, {
      method: 'PATCH',
      body: { name: editTokenName.value.trim() },
    })
    showEditDialog.value = false
    editToken.value = null
    editTokenName.value = ''
    fetchTokens()
  } catch (e: any) {
    editError.value = e?.data?.message || 'Failed to update token. Please try again.'
  } finally {
    isEditing.value = false
  }
}

// ─── JSON syntax highlighting ─────────────────────────

function highlightJson(data: any): string {
  const json = JSON.stringify(data, null, 2)
  return json.replace(
    /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(-?\d+\.?\d*(?:[eE][+-]?\d+)?)|(true|false|null)/g,
    (match, key, str, num, bool) => {
      if (key) return `<span class="text-sky-300">${key}</span>:`
      if (str) return `<span class="text-green-300">${str}</span>`
      if (num) return `<span class="text-orange-300">${num}</span>`
      if (bool) return `<span class="text-purple-300">${bool}</span>`
      return match
    }
  )
}

// ─── API Reference ────────────────────────────────────

const referenceSearch = ref('')

const filteredApiGroups = computed(() => {
  const q = referenceSearch.value.toLowerCase().trim()
  if (!q) return apiGroups
  return apiGroups
    .map(group => ({
      ...group,
      endpoints: group.endpoints.filter(e =>
        e.method.toLowerCase().includes(q) ||
        e.path.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      ),
    }))
    .filter(group => group.endpoints.length > 0)
})

const methodClass = (method: string) => {
  const classes: Record<string, string> = {
    GET: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    PUT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  }
  return classes[method] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
}

const apiGroups = [
  {
    label: 'Images',
    description: 'Browse, retrieve, and interact with illustrations.',
    endpoints: [
      { method: 'GET', path: '/images', description: 'List all images with optional pagination and field selection.' },
      { method: 'GET', path: '/images/{id}', description: 'Get a single image binary by its numeric ID.' },
      { method: 'GET', path: '/images/slug/{slug}', description: 'Get a single image by its slug, including aspect variants.' },
      { method: 'PUT', path: '/images/slug/{slug}/views', description: 'Increment an image\'s view count.' },
      { method: 'PUT', path: '/images/slug/{slug}/downloads', description: 'Increment an image\'s download count.' },
    ],
  },
  {
    label: 'Collections',
    description: 'Organize images into curated groups.',
    endpoints: [
      { method: 'GET', path: '/collections', description: 'List collections with pagination. Use ?includePrivate=true to include private collections (requires auth).' },
      { method: 'GET', path: '/collections/{slug}', description: 'Get a single collection with its images.' },
    ],
  },
  {
    label: 'Tags',
    description: 'Classify and discover images by topic.',
    endpoints: [
      { method: 'GET', path: '/tags', description: 'List tags with search, pagination, and sorting options.' },
    ],
  },
  {
    label: 'Search',
    description: 'Full-text search across images and collections.',
    endpoints: [
      { method: 'GET', path: '/search', description: 'Search images and collections by query string (?q=).' },
    ],
  },
  {
    label: 'Grid',
    description: 'Home page grid layout data.',
    endpoints: [
      { method: 'GET', path: '/grid', description: 'Get all images with their grid positions for the draggable layout.' },
    ],
  },
  {
    label: 'Authentication',
    description: 'Sign in, register, and manage API tokens.',
    endpoints: [
      { method: 'POST', path: '/login', description: 'Sign in with email and password. A session cookie is set on success.' },
      { method: 'POST', path: '/register', description: 'Create a new account.' },
      { method: 'POST', path: '/logout', description: 'Sign out and clear the session.' },
      { method: 'GET', path: '/api-tokens', description: 'List your API tokens.' },
      { method: 'POST', path: '/api-tokens', description: 'Create a new API token. The full token is returned only once.' },
      { method: 'PATCH', path: '/api-tokens/{id}', description: 'Update an API token name.' },
      { method: 'POST', path: '/api-tokens/{id}/revoke', description: 'Revoke an API token (reversible).' },
      { method: 'POST', path: '/api-tokens/{id}/activate', description: 'Reactivate a revoked API token.' },
      { method: 'DELETE', path: '/api-tokens/{id}', description: 'Permanently delete an API token.' },
    ],
  },
  {
    label: 'Contact',
    description: 'Send messages to the artist.',
    endpoints: [
      { method: 'POST', path: '/messages', description: 'Send a contact message.' },
    ],
  },
]

onMounted(() => {
  if (loggedIn.value) {
    fetchTokens()
  }
})
</script>
