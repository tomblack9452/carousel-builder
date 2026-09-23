import { W, H, SUB_FONT } from '../constants'
import type { Slide } from '../types'
import { fitImage } from './geometry'

export type Ctx = CanvasRenderingContext2D

export function font(weight: number | '', size: number, family: string): string {
  return `${weight ? weight + ' ' : ''}${size}px ${family}`
}

/** Draw the slide's image cover-fitted, zoomed and panned. */
export function drawSlideImage(ctx: Ctx, slide: Slide): void {
  if (!slide.img) return
  const { width, height, marginX, marginY } = fitImage(slide.img, slide.zoom)
  ctx.drawImage(slide.img, -marginX + slide.px * marginX, -marginY + slide.py * marginY, width, height)
}

export function placeholder(ctx: Ctx, text: string): void {
  ctx.fillStyle = '#2a2540'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#a59fb8'
  ctx.font = font(600, 52, SUB_FONT)
  ctx.textAlign = 'center'
  ctx.fillText(text, W / 2, H / 2)
  ctx.textAlign = 'left'
}

/** Dark gradient from `from` (fraction of height) to the bottom edge, for text legibility. */
export function shade(ctx: Ctx, from: number, alpha: number): void {
  const g = ctx.createLinearGradient(0, H * from, 0, H)
  g.addColorStop(0, 'rgba(18,10,28,0)')
  g.addColorStop(1, `rgba(18,10,28,${alpha})`)
  ctx.fillStyle = g
  ctx.fillRect(0, H * from, W, H * (1 - from))
}

/** White text with a hard offset shadow in `shadow` colour. Uses the current ctx.font. */
export function hardText(ctx: Ctx, text: string, x: number, y: number, offset: number, shadow: string): void {
  ctx.fillStyle = shadow
  ctx.fillText(text, x + offset, y + offset)
  ctx.fillStyle = '#fff'
  ctx.fillText(text, x, y)
}

/** Largest size (stepping down by 2 from `start`) at which every line fits `maxWidth`. */
export function fitSize(
  ctx: Ctx, lines: string[], weight: number | '', family: string,
  maxWidth: number, start: number, min: number,
): number {
  let size = start
  for (; size > min; size -= 2) {
    ctx.font = font(weight, size, family)
    if (lines.every((l) => ctx.measureText(l).width <= maxWidth)) break
  }
  return size
}

/** Word-wrap `text`, shrinking by 4 from `start` until it fits in `maxLines`. Falls back to `min`. */
export function wrapFit(
  ctx: Ctx, text: string, weight: number | '', family: string,
  maxWidth: number, start: number, min: number, maxLines: number,
): { size: number; lines: string[] } {
  let best = { size: start, lines: [] as string[] }
  for (let size = start; size >= min; size -= 4) {
    ctx.font = font(weight, size, family)
    const lines: string[] = []
    let current = ''
    for (const word of text.split(/\s+/).filter(Boolean)) {
      const candidate = current ? current + ' ' + word : word
      if (!current || ctx.measureText(candidate).width <= maxWidth) current = candidate
      else { lines.push(current); current = word }
    }
    if (current) lines.push(current)
    best = { size, lines }
    if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxWidth)) return best
  }
  return best
}

export function drawHandle(
  ctx: Ctx, handle: string, align: CanvasTextAlign,
  x: number, y: number, size: number, alpha: number,
): void {
  const text = handle.trim()
  if (!text) return
  ctx.save()
  ctx.font = font(600, size, SUB_FONT)
  ctx.textAlign = align
  ctx.fillStyle = `rgba(255,255,255,${alpha})`
  ctx.shadowColor = 'rgba(0,0,0,.55)'
  ctx.shadowBlur = 8
  ctx.fillText(text, x, y)
  ctx.restore()
}
