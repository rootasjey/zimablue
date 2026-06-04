import { describe, it, expect } from 'vitest'

describe('useNavigation', () => {
  it('returns default navigation items', async () => {
    const { useNavigation } = await import('../../../app/composables/useNavigation')
    const items = useNavigation()

    expect(items).toHaveLength(3)
    expect(items.map(i => i.title)).toEqual(['home', 'collections', 'about'])
    expect(items.map(i => i.count)).toEqual([0, 0, 0])
  })

  it('applies count map to navigation items', async () => {
    const { useNavigation } = await import('../../../app/composables/useNavigation')
    const items = useNavigation({ home: 5, collections: 3 })

    expect(items[0].count).toBe(5)
    expect(items[1].count).toBe(3)
  })

  it('defaults missing keys in count map to 0', async () => {
    const { useNavigation } = await import('../../../app/composables/useNavigation')
    const items = useNavigation({ home: 2 })

    expect(items[1].count).toBe(0) // collections
    expect(items[2].count).toBe(0) // about
  })

  it('assigns distinct colors to each item', async () => {
    const { useNavigation } = await import('../../../app/composables/useNavigation')
    const items = useNavigation()

    expect(items[0].color).toBe('#3D3BF3')
    expect(items[1].color).toBe('#FAB12F')
    expect(items[2].color).toBe('#CB9DF0')
  })
})

describe('useParseVariants', () => {
  it('parses a JSON string of variants', async () => {
    const { default: useParseVariants } = await import(
      '../../../app/composables/image/useParseVariants'
    )
    const { parse } = useParseVariants()
    const result = parse('[{"size":"sm","width":320,"height":180,"pathname":"/img/sm.jpg"}]')

    expect(result).toHaveLength(1)
    expect(result[0].size).toBe('sm')
    expect(result[0].width).toBe(320)
  })

  it('passes through an already-parsed array', async () => {
    const { default: useParseVariants } = await import(
      '../../../app/composables/image/useParseVariants'
    )
    const { parse } = useParseVariants()
    const input = [{ size: 'md', width: 640, height: 360, pathname: '/img/md.jpg' }]
    const result = parse(input as any)

    expect(result).toBe(input)
    expect(result).toHaveLength(1)
  })

  it('returns empty array for null', async () => {
    const { default: useParseVariants } = await import(
      '../../../app/composables/image/useParseVariants'
    )
    const { parse } = useParseVariants()
    expect(parse(null)).toEqual([])
  })

  it('returns empty array for undefined', async () => {
    const { default: useParseVariants } = await import(
      '../../../app/composables/image/useParseVariants'
    )
    const { parse } = useParseVariants()
    expect(parse(undefined)).toEqual([])
  })

  it('handles corrupt JSON gracefully', async () => {
    const { default: useParseVariants } = await import(
      '../../../app/composables/image/useParseVariants'
    )
    const { parse } = useParseVariants()
    const result = parse('not valid json')
    expect(result).toEqual([])
  })
})

describe('useTagColor', () => {
  it('generates CSS custom properties for a valid hex color', async () => {
    const { useTagColor } = await import('../../../app/composables/useTagColor')
    const { getTagBadgeStyles } = useTagColor()
    const styles = getTagBadgeStyles('#3B82F6')

    expect(styles['--tag-bg']).toContain('59, 130, 246')
    expect(styles['--tag-text']).toBe('rgb(59, 130, 246)')
    expect(styles['--tag-bg-dark']).toContain('59, 130, 246')
    expect(styles['--tag-text-dark']).toContain('119, 190, 255')
  })

  it('falls back to purple when no color provided', async () => {
    const { useTagColor } = await import('../../../app/composables/useTagColor')
    const { getTagBadgeStyles } = useTagColor()
    const styles = getTagBadgeStyles()

    expect(styles['--tag-text']).toBe('rgb(147, 51, 234)')
  })

  it('falls back to purple for empty string', async () => {
    const { useTagColor } = await import('../../../app/composables/useTagColor')
    const { getTagBadgeStyles } = useTagColor()
    const styles = getTagBadgeStyles('')

    expect(styles['--tag-text']).toBe('rgb(147, 51, 234)')
  })

  it('falls back to purple for invalid hex', async () => {
    const { useTagColor } = await import('../../../app/composables/useTagColor')
    const { getTagBadgeStyles } = useTagColor()
    const styles = getTagBadgeStyles('zzz')

    expect(styles['--tag-text']).toBe('rgb(147, 51, 234)')
  })
})

describe('useImageSrc', () => {
  it('returns hubblob source when no variants exist', async () => {
    const { useImageSrc } = await import('../../../app/composables/image/useImageSrc')
    const { getSrc } = useImageSrc()
    const image = { pathname: '/images/1/original.jpg', updated_at: '2025-01-01', variants: '[]' } as any

    const result = getSrc(image, 'mobile-grid')

    expect(result.src).toBe('/images/1/original.jpg')
    expect(result.provider).toBe('hubblob')
  })

  it('selects smallest variant that meets target width', async () => {
    const { useImageSrc } = await import('../../../app/composables/image/useImageSrc')
    const { getSrc } = useImageSrc()
    const image = {
      pathname: '/images/1/original.jpg',
      updated_at: '2025-01-01',
      variants: JSON.stringify([
        { size: 'xs', width: 100, height: 56, pathname: '/img/xs.jpg' },
        { size: 'sm', width: 320, height: 180, pathname: '/img/sm.jpg' },
        { size: 'md', width: 640, height: 360, pathname: '/img/md.jpg' },
        { size: 'lg', width: 1200, height: 675, pathname: '/img/lg.jpg' },
      ]),
    } as any

    const result = getSrc(image, 'desktop-grid') // target 640

    expect(result.src).toBe('/img/md.jpg') // md = 640 >= 640
  })

  it('falls back to largest variant when no variant meets target width', async () => {
    const { useImageSrc } = await import('../../../app/composables/image/useImageSrc')
    const { getSrc } = useImageSrc()
    const image = {
      pathname: '/images/1/original.jpg',
      updated_at: '2025-01-01',
      variants: JSON.stringify([
        { size: 'sm', width: 320, height: 180, pathname: '/img/sm.jpg' },
      ]),
    } as any

    const result = getSrc(image, 'modal') // target 800, only 320 available

    expect(result.src).toBe('/img/sm.jpg')
  })

  it('includes cache-busting modifier', async () => {
    const { useImageSrc } = await import('../../../app/composables/image/useImageSrc')
    const { getSrc } = useImageSrc()
    const image = { pathname: '/img.jpg', updated_at: '2025-06-04', variants: '[]' } as any

    const result = getSrc(image, 'mobile-grid')

    expect(result.modifiers?.v).toBe('2025-06-04')
  })
})
