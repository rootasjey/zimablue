/**
 * Tag color utility — converts a hex color to CSS custom properties
 * that drive dynamic tag badge colors with dark mode support.
 */
export function useTagColor() {
  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const clean = hex.replace('#', '')
    if (clean.length !== 6) return null
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    }
  }

  /**
   * Returns CSS custom properties for a tag badge based on its hex color.
   * Falls back to purple-600 (#9333EA) when no color is provided.
   *
   * The returned object is meant to be used with `:style` binding,
   * paired with UnoCSS classes:
   *   bg-[var(--tag-bg)] text-[var(--tag-text)]
   *   dark:bg-[var(--tag-bg-dark)] dark:text-[var(--tag-text-dark)]
   */
  function getTagBadgeStyles(hexColor?: string | null): Record<string, string> {
    const color = hexColor || '#9333EA'
    const rgb = hexToRgb(color)
    if (!rgb) {
      return {
        '--tag-bg': 'rgba(147, 51, 234, 0.12)',
        '--tag-text': 'rgb(147, 51, 234)',
        '--tag-bg-dark': 'rgba(147, 51, 234, 0.2)',
        '--tag-text-dark': 'rgb(196, 167, 234)',
      }
    }
    const { r, g, b } = rgb
    const lr = Math.min(255, r + 60)
    const lg = Math.min(255, g + 60)
    const lb = Math.min(255, b + 60)
    return {
      '--tag-bg': `rgba(${r}, ${g}, ${b}, 0.14)`,
      '--tag-text': `rgb(${r}, ${g}, ${b})`,
      '--tag-bg-dark': `rgba(${r}, ${g}, ${b}, 0.2)`,
      '--tag-text-dark': `rgb(${lr}, ${lg}, ${lb})`,
    }
  }

  return { getTagBadgeStyles }
}
