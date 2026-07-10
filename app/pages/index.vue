<template>
  <div class="frame mt-2 md:mt-0">
    <!-- Mobile Home Layout -->
    <MobileHomeLayout
      v-if="!isInitialGridLoading && layout.length > 0"
      :layout="layout"
      @open-image="(image, event) => imageModal.openImageModal(image, event)"
    />

    <!-- Desktop gallery -->
    <div class="hidden sm:block">
      <GalleryView />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Image } from '~~/shared/types/image'
import { useGridStore } from '@/stores/useGridStore'
import { useImageModal } from '~/composables/image/useImageModal'
import { useParseVariants } from '~/composables/image/useParseVariants'

const gridStore = useGridStore()
const layout = computed(() => gridStore.layout)
const isInitialGridLoading = computed(() => !gridStore.initialized)
const imageModal = useImageModal()

// Handle ?image=<slug> for social media preview
const route = useRoute()
const config = useRuntimeConfig()
const imageSlug = computed(() => route.query.image as string | undefined)

const { data: previewImage } = await useAsyncData<Image | null>(
  'image-preview',
  async () => {
    const slug = useRoute().query.image as string | undefined
    if (!slug) return null
    return await $fetch<Image>(`/api/images/slug/${slug}`)
  },
  { server: true }
)

const { parse: parsePreviewVariants } = useParseVariants()

const ogImageUrl = computed(() => {
  if (!previewImage.value) return undefined
  const variants = parsePreviewVariants(previewImage.value.variants)
  const variant = variants.find(v => v.size === 'md') || variants.find(v => v.size === 'lg') || variants.find(v => v.size === 'original')
  const pathname = variant?.pathname || previewImage.value.pathname
  const cleanPath = pathname.startsWith('/') ? pathname.slice(1) : pathname
  return `${config.public.siteUrl}/images/${cleanPath}`
})

if (imageSlug.value) {
  useSeoMeta({
    title: () => previewImage.value?.name || 'Illustration',
    description: () => previewImage.value?.description || 'View this digital illustration',
    ogTitle: () => `${previewImage.value?.name || 'Illustration'} — Zima Blue`,
    ogDescription: () => previewImage.value?.description || 'View this digital illustration',
    ogImage: () => ogImageUrl.value,
    ogImageWidth: () => previewImage.value?.w ? String(previewImage.value.w) : undefined,
    ogImageHeight: () => previewImage.value?.h ? String(previewImage.value.h) : undefined,
    twitterTitle: () => `${previewImage.value?.name || 'Illustration'} — Zima Blue`,
    twitterDescription: () => previewImage.value?.description || 'View this digital illustration',
    twitterImage: () => ogImageUrl.value,
  })
}

// Handle ?collection=<slug> for social media preview
const collectionSlug = computed(() => route.query.collection as string | undefined)

const { data: collectionData } = await useAsyncData<Record<string, any> | null>(
  'collection-preview',
  async () => {
    const slug = useRoute().query.collection as string | undefined
    if (!slug) return null
    return await $fetch<Record<string, any>>(`/api/collections/${slug}`)
  },
  { server: true }
)

const collectionPreview = computed(() => collectionData.value?.collection ?? null)
const collectionPreviewImages = computed(() => collectionData.value?.images ?? [])

const collectionOgImageUrl = computed(() => {
  const images = collectionPreviewImages.value
  if (!images || images.length === 0) return undefined
  const pathname = images[0]?.pathname
  if (!pathname) return undefined
  const cleanPath = pathname.startsWith('/') ? pathname.slice(1) : pathname
  return `${config.public.siteUrl}/images/${cleanPath}`
})

if (collectionSlug.value) {
  useSeoMeta({
    title: () => collectionPreview.value?.name || 'Collection',
    description: () => collectionPreview.value?.description || 'Explore this curated collection',
    ogTitle: () => `${collectionPreview.value?.name || 'Collection'} — Zima Blue`,
    ogDescription: () => collectionPreview.value?.description || 'Explore this curated collection',
    ogImage: () => collectionOgImageUrl.value,
    twitterTitle: () => `${collectionPreview.value?.name || 'Collection'} — Zima Blue`,
    twitterDescription: () => collectionPreview.value?.description || 'Explore this curated collection',
    twitterImage: () => collectionOgImageUrl.value,
  })
}

if (!imageSlug.value && !collectionSlug.value) {
  const { data: latestImages } = await useAsyncData<Record<string, any>[] | null>(
    'og-latest-images',
    async () => {
      try {
        return await $fetch<Record<string, any>[]>('/api/images/latest')
      } catch { return null }
    },
    { server: true }
  )

  const ogThumbnailUrls = computed(() => {
    const images = latestImages.value
    if (!images || images.length === 0) return []
    const origin = useRequestURL().origin
    return images.slice(0, 6).map((img: any) => {
      const p = img.pathname as string
      const cleanPath = p.startsWith('/') ? p.slice(1) : p
      return `${origin}/${cleanPath}`
    })
  })

  defineOgImageComponent('Default.takumi', {
    title: 'ZIMA BLUE',
    description: 'Borderless artistic space — A curated gallery of digital illustrations',
    thumbnails: () => ogThumbnailUrls.value,
  }, {
    fonts: {
      Caprasimo: 'https://fonts.googleapis.com/css2?family=Caprasimo',
    },
  })
}

onMounted(() => {
  if (!gridStore.initialized) {
    gridStore.fetchGrid()
  }
})
</script>

<style scoped>
.frame {
  display: flex;
  flex-direction: column;
  overflow: auto;
  width: 100%;
  border-radius: 0.75rem;
  transition: all 500ms;
  
  @media (min-width: 768px) {
    justify-content: center;
  }
}
</style>
