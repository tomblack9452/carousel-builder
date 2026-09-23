export interface Palette {
  accent: string
  background: string
  overlay: string
}

const SAMPLE = 48
const BUCKETS = 18

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
}

/**
 * Pick theme colours from an image: its most vivid hue becomes the accent,
 * and deep shades of that hue become the background and overlay.
 * Returns null for images with no real colour (e.g. black and white).
 */
export function paletteFromImage(img: CanvasImageSource): Palette | null {
  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE
  canvas.height = SAMPLE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE)
  const data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data

  const weight = new Array<number>(BUCKETS).fill(0)
  const sums = Array.from({ length: BUCKETS }, () => [0, 0, 0])
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2])
    if (s < 0.25 || l < 0.15 || l > 0.9) continue
    // Favour saturated mid-tones: they read as "the colour" of a picture.
    const w = s * (1 - Math.abs(l - 0.5) * 1.4)
    const b = Math.floor(h / (360 / BUCKETS)) % BUCKETS
    weight[b] += w
    sums[b][0] += data[i] * w
    sums[b][1] += data[i + 1] * w
    sums[b][2] += data[i + 2] * w
  }

  const best = weight.indexOf(Math.max(...weight))
  if (weight[best] <= 0) return null
  const [r, g, b] = sums[best].map((v) => v / weight[best])
  const [h, s, l] = rgbToHsl(r, g, b)
  return {
    accent: hslToHex(h, Math.max(s, 0.7), Math.min(0.62, Math.max(0.5, l))),
    background: hslToHex(h, 0.3, 0.12),
    overlay: hslToHex(h, 0.4, 0.06),
  }
}
