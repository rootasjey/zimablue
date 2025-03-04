import { joinURL } from 'ufo'
import type { ProviderGetImage } from '@nuxt/image'
import { createOperationsGenerator, createImage } from '#image'

const operationsGenerator = createOperationsGenerator()

export const getImage: ProviderGetImage = (
  src,
  { modifiers = {}, baseURL } = {}
) => {
  if (!baseURL) {
    baseURL = useRuntimeConfig().public.siteUrl
  }

  const operations = operationsGenerator(modifiers).replaceAll(/[/]/g, '&')
  return {
    url: joinURL(baseURL, src + (operations ? '?' + operations : '')),
  }
}
