import type { Image, VariantType } from '~~/shared/types/image'
import useParseVariants from './useParseVariants'

export type ImageContext = 'mobile-grid' | 'desktop-grid' | 'drawer' | 'modal'

const CONTEXT_WIDTH: Record<ImageContext, number> = {
  'mobile-grid':  180,
  // Desktop grid items can span multiple columns and be resized,
  // so prefer a larger source to avoid visibly soft images.
  'desktop-grid': 640,
  'drawer':       400,
  'modal':        800,
}

export const useImageSrc = () => {
  const { parse } = useParseVariants()

  const getSrc = (image: Image, context: ImageContext) => {
    const targetWidth = CONTEXT_WIDTH[context]
    const variants = parse(image.variants)

    if (variants.length === 0) {
      // Pas de variants → fallback pathname brut via hubblob
      return {
        src: image.pathname,
        provider: 'hubblob' as const,
        modifiers: {} as Record<string, string | number>,
      }
    }

    // Plus petit variant dont la largeur >= targetWidth
    const suitable = variants
      .filter((v: VariantType) => v.width >= targetWidth)
      .sort((a: VariantType, b: VariantType) => a.width - b.width)

    // Sinon le plus grand dispo
    const best = suitable[0] ?? [...variants].sort((a: VariantType, b: VariantType) => b.width - a.width)[0]!

    // pathname est la clé R2 complète (ex: "images/42/sm.webp")
    // On passe toujours par hubblob pour que le provider sache construire l'URL
    // (fonctionne en local via le proxy Nitro ET en prod via Cloudflare R2)
    return {
      src: best.pathname,
      provider: 'hubblob' as const,
      modifiers: {} as Record<string, string | number>,
    }
  }

  return { getSrc }
}
