import encodeAvif, { init as initAvifEncoder } from '@jsquash/avif/encode.js'
import avifEncoderWasm from '@jsquash/avif/codec/enc/avif_enc.wasm?module'
import type { VariantType } from '~~/shared/types/image'
import { blob } from 'hub:blob'
import { IMAGE_SIZES, JPEG_VARIANT_QUALITY } from './images'

const AVIF_SIZES = new Set(['xs', 'sm', 'md', 'lg'])
const AVIF_QUALITY = 24

let encoderReady: ReturnType<typeof initAvifEncoder> | undefined

interface JimpImageLike {
  bitmap: { data: Uint8Array; width: number; height: number }
  width: number
  height: number
  clone(): JimpImageLike
  resize(options: { w: number }): JimpImageLike
  getBuffer(mimeType: string, options?: { quality: number }): Promise<Buffer>
}

async function encodeAvifVariant(image: JimpImageLike): Promise<ArrayBuffer> {
  encoderReady ??= initAvifEncoder(avifEncoderWasm)
  await encoderReady

  const { data, width, height } = image.bitmap
  const imageData = new ImageData(new Uint8ClampedArray(data), width, height)
  return encodeAvif(imageData, { cqLevel: AVIF_QUALITY })
}

export async function generateImageVariants(options: {
  image: JimpImageLike
  imagePrefix: string
  originalPath?: string
  extension: string
  mimeType: string
  existingVariants?: VariantType[]
}): Promise<VariantType[]> {
  const { image, imagePrefix, originalPath, extension, mimeType, existingVariants = [] } = options
  const variants: VariantType[] = [{
    size: 'original',
    width: image.width,
    height: image.height,
    pathname: originalPath ?? `${imagePrefix}/original.${extension}`,
  }]

  for (const size of IMAGE_SIZES) {
    const resized = image.clone().resize({ w: size.width })
    const existing = existingVariants.find(v => v.size === size.suffix && v.format !== 'avif')
    const variantPath = existing?.pathname ?? `${imagePrefix}/${size.suffix}.${extension}`
    const buffer = mimeType === 'image/jpeg'
      ? await resized.getBuffer('image/jpeg', { quality: JPEG_VARIANT_QUALITY })
      : await resized.getBuffer(mimeType as Parameters<typeof resized.getBuffer>[0])

    const response = await blob.put(variantPath, new Blob([new Uint8Array(buffer)], { type: mimeType }), {
      addRandomSuffix: false,
    })
    variants.push({
      size: size.suffix,
      width: resized.width,
      height: resized.height,
      pathname: response.pathname,
    })

    if (!AVIF_SIZES.has(size.suffix) || mimeType === 'image/gif') continue

    try {
      const avifBuffer = await encodeAvifVariant(resized)
      const existingAvif = existingVariants.find(v => v.size === size.suffix && v.format === 'avif')
      const avifPath = existingAvif?.pathname ?? `${imagePrefix}/${size.suffix}.avif`
      const avifResponse = await blob.put(avifPath, new Blob([avifBuffer], { type: 'image/avif' }), {
        addRandomSuffix: false,
      })
      variants.push({
        size: size.suffix,
        width: resized.width,
        height: resized.height,
        pathname: avifResponse.pathname,
        format: 'avif',
      })
    } catch (error) {
      console.warn(`AVIF ${size.suffix} generation failed; keeping the standard image variant`, error)
    }
  }

  return variants
}
