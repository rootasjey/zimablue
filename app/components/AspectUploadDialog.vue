<template>
  <NDialog
    :open="isOpen"
    @update:open="$emit('update:isOpen', $event)"
    :show-close="false"
    :_dialog="{ class: 'w-[calc(100vw-1rem)] sm:max-w-lg' }"
  >
    <template #content>
      <div class="p-3 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Upload as Aspect Variant</h2>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors"
            @click="$emit('update:isOpen', false)"
          >
            <span class="i-ph-x text-lg" />
          </button>
        </div>

        <div v-if="parentImage" class="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
          <NuxtImg
            :src="getThumbSrc(parentImage)"
            provider="hubblob"
            :alt="parentImage.name"
            class="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-stone-100 dark:bg-zinc-800"
            @error="handleImgError"
          />
          <div>
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Lier à : {{ parentImage.name }}</p>
            <p class="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">Le nouveau fichier sera ajouté comme variante</p>
          </div>
        </div>

        <!-- Aspect label selector -->
        <div class="space-y-1">
          <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Label de la variante</label>
          <select
            v-model="aspectLabel"
            class="w-full px-3 h-9 rounded-lg text-sm bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
          >
            <option v-for="l in ASPECT_LABELS" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>

        <!-- File selector -->
        <div class="space-y-1">
          <label class="text-xs font-medium text-stone-500 dark:text-zinc-400">Fichier image</label>
          <div
            class="relative border-2 border-dashed border-stone-300 dark:border-zinc-600 rounded-lg p-8 text-center cursor-pointer hover:border-solid hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
            :class="{ 'opacity-50': selectedFile }"
            @click="triggerFilePick"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFileSelected"
            />
            <div v-if="!selectedFile" class="flex flex-col items-center justify-center">
              <span class="i-ph-upload-simple text-3xl text-stone-400 dark:text-zinc-500" />
              <p class="text-sm text-stone-500 dark:text-zinc-400">Cliquez pour choisir un fichier</p>
              <p class="text-xs text-stone-400 dark:text-zinc-500 mt-1">PNG, JPG, WebP (max 30MB)</p>
            </div>
            <div v-else class="flex items-center justify-center gap-3">
              <span class="i-ph-check-circle text-2xl text-green-500" />
              <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-60">{{ selectedFile.name }}</span>
            </div>
          </div>
        </div>

        <div v-if="uploadError" class="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-sm text-rose-600 dark:text-rose-400">
          {{ uploadError }}
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            class="px-4 h-9 rounded-lg text-sm font-medium bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
            @click="$emit('update:isOpen', false)"
          >
            Annuler
          </button>
          <button
            class="px-4 h-9 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            :disabled="!selectedFile || isUploading"
            @click="uploadAndLink"
          >
            <span v-if="isUploading" class="i-ph-spinner-gap animate-spin" />
            {{ isUploading ? 'Upload...' : 'Upload & Link' }}
          </button>
        </div>
      </div>
    </template>
  </NDialog>
</template>

<script lang="ts" setup>
import type { Image, VariantType } from '~~/shared/types/image'

const ASPECT_LABELS = ['Portrait', 'Paysage', 'Carré'] as const

interface Props {
  isOpen: boolean
  parentImage: Image | null
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'complete'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { toast } = useToast()
const { showErrorToast } = useErrorToast()

const aspectLabel = ref('Paysage')
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const uploadError = ref('')
const fileInputRef = ref<HTMLInputElement>()

function triggerFilePick() {
  fileInputRef.value?.click()
}

function onFileSelected(event: Event) {
  uploadError.value = ''
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  const file = files[0]!
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Le fichier doit être une image.'
    return
  }
  if (file.size > 30 * 1024 * 1024) {
    uploadError.value = 'Le fichier doit faire moins de 30MB.'
    return
  }
  selectedFile.value = file
}

async function uploadAndLink() {
  const file = selectedFile.value
  const parent = props.parentImage
  if (!file || !parent) return

  isUploading.value = true
  uploadError.value = ''

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    formData.append('type', file.type)
    formData.append('x', '0')
    formData.append('y', '0')
    formData.append('w', '4')
    formData.append('h', '6')
    formData.append('aspectGroupId', parent.id.toString())
    formData.append('aspectLabel', aspectLabel.value)

    const response: any = await $fetch('/api/images/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response?.success) {
      throw new Error("L'upload a échoué")
    }

    toast({
      title: 'Variante ajoutée',
      description: `${aspectLabel.value} liée à ${parent.name}`,
      toast: 'soft-success',
      duration: 3000,
    })

    selectedFile.value = null
    emit('complete')
    emit('update:isOpen', false)
  } catch (error) {
    showErrorToast(error, 'Erreur', "Échec de l'upload de la variante.")
    uploadError.value = "Échec de l'upload. Veuillez réessayer."
  } finally {
    isUploading.value = false
  }
}

const parseVariants = (variants: string | VariantType[] | null | undefined): VariantType[] => {
  try {
    if (!variants) return []
    if (Array.isArray(variants)) return variants
    const parsed = JSON.parse(variants) as VariantType[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getThumbSrc = (row: { variants?: string | VariantType[]; pathname?: string } | null) => {
  if (!row) return ''
  const list = parseVariants(row.variants as any)
  const found = list.find(v => v.size === 'xxs' || v.size === 'xs' || v.size === 'sm')
  const path = found?.pathname || row.pathname || ''
  return path.startsWith('/') ? path : `/${path}`
}

const handleImgError = (payload: string | Event) => {
  const evt = payload as Event
  const img = evt?.target as HTMLImageElement | undefined
  if (img) img.style.display = 'none'
}
</script>
