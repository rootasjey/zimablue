import type { VariantType } from '~~/shared/types/image'

/**
 * Safely parse variants that may be stored either as a JSON string
 * or already-parsed array (server responses are inconsistent).
 */
export const useParseVariants = () => {
  const parse = (variants: string | VariantType[] | null | undefined): VariantType[] => {
    if (!variants) return []
    if (Array.isArray(variants)) return variants

    try {
      return JSON.parse(variants) as VariantType[]
    } catch (err) {
      // Gracefully handle corrupt/legacy data
      console.error('Failed to parse variants:', err)
      return []
    }
  }

  return {
    parse,
  }
}

export default useParseVariants
