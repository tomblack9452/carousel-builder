import type { Theme } from '../types'

export interface Preset {
  id: string
  label: string
  theme: Theme
}

/** One-click looks. The first is the default theme. */
export const PRESETS: Preset[] = [
  {
    id: 'classic',
    label: 'Classic',
    theme: {
      fontPair: 'anton', headingWeight: 400, headingScale: 1, bodyScale: 1, letterSpacing: 0, uppercase: true,
      accent: '#ff7a3d', text: '#ffffff', background: '#2a2540', overlay: '#120a1c', overlayStrength: 1, titleEffect: 'hard',
    },
  },
  {
    id: 'neon',
    label: 'Neon',
    theme: {
      fontPair: 'bebas', headingWeight: 400, headingScale: 1.1, bodyScale: 1, letterSpacing: 0.03, uppercase: true,
      accent: '#ff2bd6', text: '#ffffff', background: '#0b0620', overlay: '#0b0620', overlayStrength: 1.15, titleEffect: 'glow',
    },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    theme: {
      fontPair: 'inter', headingWeight: 800, headingScale: 0.9, bodyScale: 0.95, letterSpacing: -0.02, uppercase: false,
      accent: '#d9d9d9', text: '#ffffff', background: '#141414', overlay: '#000000', overlayStrength: 0.8, titleEffect: 'none',
    },
  },
  {
    id: 'editorial',
    label: 'Editorial',
    theme: {
      fontPair: 'playfair', headingWeight: 700, headingScale: 0.95, bodyScale: 1, letterSpacing: 0, uppercase: false,
      accent: '#c9a36b', text: '#fbf7f0', background: '#1d1a17', overlay: '#0d0b09', overlayStrength: 1, titleEffect: 'none',
    },
  },
  {
    id: 'retro',
    label: 'Retro',
    theme: {
      fontPair: 'bungee', headingWeight: 400, headingScale: 0.85, bodyScale: 0.9, letterSpacing: 0, uppercase: true,
      accent: '#00c2b2', text: '#fff4d6', background: '#2b1846', overlay: '#1a0f2e', overlayStrength: 1, titleEffect: 'hard',
    },
  },
  {
    id: 'bold',
    label: 'Bold',
    theme: {
      fontPair: 'archivo', headingWeight: 400, headingScale: 0.9, bodyScale: 1, letterSpacing: -0.01, uppercase: true,
      accent: '#ffd400', text: '#ffffff', background: '#111111', overlay: '#000000', overlayStrength: 1, titleEffect: 'hard',
    },
  },
]

export function presetTheme(id: string): Theme {
  return { ...(PRESETS.find((p) => p.id === id) ?? PRESETS[0]).theme }
}

/** The preset a theme exactly matches, if any. */
export function matchingPreset(theme: Theme): string | null {
  const keys = Object.keys(PRESETS[0].theme) as (keyof Theme)[]
  return PRESETS.find((p) => keys.every((k) => p.theme[k] === theme[k]))?.id ?? null
}
