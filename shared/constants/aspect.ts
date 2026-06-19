export const ASPECT_LABELS = ['Portrait', 'Paysage', 'Carré'] as const

export type AspectLabel = typeof ASPECT_LABELS[number]
