export interface FontFace {
  family: string
  /** Weights to load from Google Fonts. */
  weights: number[]
  fallback: string
}

export interface FontPair {
  id: string
  label: string
  heading: FontFace
  body: FontFace
}

const SANS = 'system-ui, sans-serif'
const CONDENSED = 'Impact, "Arial Narrow", sans-serif'
const SERIF = 'Georgia, serif'

/** Curated heading + body pairings. The first is the default. */
export const FONT_PAIRS: FontPair[] = [
  {
    id: 'anton',
    label: 'Anton + Barlow Condensed',
    heading: { family: 'Anton', weights: [400], fallback: CONDENSED },
    body: { family: 'Barlow Condensed', weights: [400, 600], fallback: '"Arial Narrow", sans-serif' },
  },
  {
    id: 'bebas',
    label: 'Bebas Neue + Inter',
    heading: { family: 'Bebas Neue', weights: [400], fallback: CONDENSED },
    body: { family: 'Inter', weights: [400, 600], fallback: SANS },
  },
  {
    id: 'oswald',
    label: 'Oswald + Source Sans 3',
    heading: { family: 'Oswald', weights: [500, 600, 700], fallback: CONDENSED },
    body: { family: 'Source Sans 3', weights: [400, 600], fallback: SANS },
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    heading: { family: 'Montserrat', weights: [600, 700, 800, 900], fallback: SANS },
    body: { family: 'Montserrat', weights: [400, 600], fallback: SANS },
  },
  {
    id: 'inter',
    label: 'Inter',
    heading: { family: 'Inter', weights: [600, 700, 800, 900], fallback: SANS },
    body: { family: 'Inter', weights: [400, 600], fallback: SANS },
  },
  {
    id: 'poppins',
    label: 'Poppins',
    heading: { family: 'Poppins', weights: [600, 700, 800, 900], fallback: SANS },
    body: { family: 'Poppins', weights: [400, 600], fallback: SANS },
  },
  {
    id: 'archivo',
    label: 'Archivo Black + Archivo',
    heading: { family: 'Archivo Black', weights: [400], fallback: SANS },
    body: { family: 'Archivo', weights: [400, 600], fallback: SANS },
  },
  {
    id: 'playfair',
    label: 'Playfair Display + Lato',
    heading: { family: 'Playfair Display', weights: [600, 700, 800, 900], fallback: SERIF },
    body: { family: 'Lato', weights: [400, 700], fallback: SANS },
  },
  {
    id: 'dmserif',
    label: 'DM Serif Display + DM Sans',
    heading: { family: 'DM Serif Display', weights: [400], fallback: SERIF },
    body: { family: 'DM Sans', weights: [400, 600], fallback: SANS },
  },
  {
    id: 'bungee',
    label: 'Bungee + Space Mono',
    heading: { family: 'Bungee', weights: [400], fallback: CONDENSED },
    body: { family: 'Space Mono', weights: [400, 700], fallback: 'monospace' },
  },
]

export const DEFAULT_FONT_PAIR = FONT_PAIRS[0].id

export function fontPair(id: string): FontPair {
  return FONT_PAIRS.find((p) => p.id === id) ?? FONT_PAIRS[0]
}

/** CSS font-family value with fallbacks. */
export function stack(face: FontFace): string {
  return `"${face.family}", ${face.fallback}`
}

/** The loaded weight closest to the one asked for. */
export function nearestWeight(face: FontFace, weight: number): number {
  return face.weights.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best))
}

export function googleFontsUrl(pair: FontPair): string {
  const faces = new Map<string, Set<number>>()
  for (const face of [pair.heading, pair.body]) {
    const weights = faces.get(face.family) ?? new Set<number>()
    face.weights.forEach((w) => weights.add(w))
    faces.set(face.family, weights)
  }
  const families = [...faces].map(([family, weights]) => {
    const name = family.replace(/ /g, '+')
    const list = [...weights].sort((a, b) => a - b)
    return list.length === 1 && list[0] === 400 ? `family=${name}` : `family=${name}:wght@${list.join(';')}`
  })
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}
