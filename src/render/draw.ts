import { SUB_FONT } from '../constants'
import { fontPair, stack } from '../fonts/catalog'
import type { Adjustments, Anchor, ImageSlot, Media, Rect, RenderDoc, Slide } from '../types'
import { fitImage } from './geometry'

export type Ctx = CanvasRenderingContext2D

/** Editor-only colours for empty image drop zones (never part of a finished slide). */
const PROMPT_BG = '#2a2a2a'
const PROMPT_TEXT = '#8a8a8a'

export function font(weight: number | '', size: number, family: string): string {
  return `${weight ? weight + ' ' : ''}${size}px ${family}`
}

/** '#rrggbb' + alpha → 'rgba(…)'. */
export function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

/** Whether dark text reads better than light text on this colour. */
export function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.299 * r + 0.587 * g + 0.114 * b > 160
}

export function slotImage(doc: RenderDoc, slot: ImageSlot | undefined): Media | null {
  return slot?.asset ? doc.images[slot.asset] ?? null : null
}

const WARM = '#ff8a3c'
const COOL = '#3c8cff'

/**
 * Draw an image cover-fitted, zoomed and panned inside `frame`, clipped to it,
 * with the slide's adjustments. Any filter already set on ctx (e.g. a blur) is kept.
 */
export function drawSlot(ctx: Ctx, img: Media, slot: ImageSlot, frame: Rect, adjust?: Adjustments): void {
  const { width, height, marginX, marginY } = fitImage(img, slot.zoom, frame.w, frame.h)
  ctx.save()
  ctx.beginPath()
  ctx.rect(frame.x, frame.y, frame.w, frame.h)
  ctx.clip()
  if (adjust && (adjust.brightness !== 1 || adjust.saturation !== 1)) {
    const base = ctx.filter === 'none' ? '' : ctx.filter + ' '
    ctx.filter = `${base}brightness(${adjust.brightness}) saturate(${adjust.saturation})`
  }
  ctx.drawImage(img, frame.x - marginX + slot.px * marginX, frame.y - marginY + slot.py * marginY, width, height)
  ctx.filter = 'none'
  if (adjust) tint(ctx, frame, adjust)
  ctx.restore()
}

/** Warmth as a soft-light colour wash, vignette as darkened edges. */
function tint(ctx: Ctx, frame: Rect, adjust: Adjustments): void {
  const { x, y, w, h } = frame
  if (adjust.warmth) {
    ctx.save()
    ctx.globalCompositeOperation = 'soft-light'
    ctx.globalAlpha = Math.abs(adjust.warmth) * 0.6
    ctx.fillStyle = adjust.warmth > 0 ? WARM : COOL
    ctx.fillRect(x, y, w, h)
    ctx.restore()
  }
  if (adjust.vignette) {
    const cx = x + w / 2
    const cy = y + h / 2
    const outer = Math.hypot(w, h) / 2
    const g = ctx.createRadialGradient(cx, cy, outer * 0.35, cx, cy, outer)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, `rgba(0,0,0,${adjust.vignette * 0.85})`)
    ctx.fillStyle = g
    ctx.fillRect(x, y, w, h)
  }
}

export function fullFrame(ctx: Ctx): Rect {
  return { x: 0, y: 0, w: ctx.canvas.width, h: ctx.canvas.height }
}

export function fillBackground(ctx: Ctx, doc: RenderDoc, frame = fullFrame(ctx)): void {
  ctx.fillStyle = doc.project.theme.background
  ctx.fillRect(frame.x, frame.y, frame.w, frame.h)
}

/**
 * Draw a slot's image into its frame. When it's empty, show `emptyText` as a
 * drop prompt, or the theme background if the image is optional (null).
 * Returns whether an image was drawn.
 */
export function drawBackground(
  ctx: Ctx, doc: RenderDoc, slide: Slide, slotIndex: number, emptyText: string | null, frame = fullFrame(ctx),
): boolean {
  const slot = slide.images[slotIndex]
  const img = slotImage(doc, slot)
  if (img) drawSlot(ctx, img, slot, frame, slide.adjust)
  else if (emptyText) placeholder(ctx, emptyText, frame)
  else fillBackground(ctx, doc, frame)
  return !!img
}

/** Empty-slot prompt: an image icon over a short instruction. */
export function placeholder(ctx: Ctx, text: string, frame = fullFrame(ctx)): void {
  const { x, y, w, h } = frame
  const cx = x + w / 2
  const cy = y + h / 2
  const s = Math.min(1, w / 540)
  ctx.save()
  ctx.fillStyle = PROMPT_BG
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = PROMPT_TEXT
  ctx.fillStyle = PROMPT_TEXT
  ctx.lineWidth = 3 * s
  ctx.lineJoin = 'round'
  // Picture frame with a sun and a hill.
  const iw = 72 * s
  const ih = 56 * s
  const top = cy - 30 * s - ih
  ctx.beginPath()
  ctx.roundRect(cx - iw / 2, top, iw, ih, 6 * s)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx + iw * 0.2, top + ih * 0.3, 6 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - iw / 2 + 6 * s, top + ih - 6 * s)
  ctx.lineTo(cx - iw * 0.1, top + ih * 0.45)
  ctx.lineTo(cx + iw * 0.12, top + ih * 0.7)
  ctx.lineTo(cx + iw * 0.25, top + ih * 0.58)
  ctx.lineTo(cx + iw / 2 - 6 * s, top + ih - 6 * s)
  ctx.stroke()
  ctx.font = font(500, Math.round(34 * s), SUB_FONT)
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, cy + 20 * s)
  ctx.restore()
}

function overlayAlpha(doc: RenderDoc, alpha: number): number {
  return Math.min(1, alpha * doc.project.theme.overlayStrength)
}

/** Gradient in the overlay colour from `from` (fraction of height) to the bottom edge, for text legibility. */
export function shade(ctx: Ctx, doc: RenderDoc, from: number, alpha: number): void {
  const { width: W, height: H } = ctx.canvas
  const colour = doc.project.theme.overlay
  const g = ctx.createLinearGradient(0, H * from, 0, H)
  g.addColorStop(0, rgba(colour, 0))
  g.addColorStop(1, rgba(colour, overlayAlpha(doc, alpha)))
  ctx.fillStyle = g
  ctx.fillRect(0, H * from, W, H * (1 - from))
}

/**
 * Legibility overlay on the side the text sits: a gradient up from the bottom
 * or down from the top, or a softer flat wash when the text is centred.
 */
export function shadeBehindText(ctx: Ctx, doc: RenderDoc, anchor: Anchor, from: number, alpha: number): void {
  if (anchor === 'bottom') return shade(ctx, doc, from, alpha)
  if (anchor === 'middle') return dim(ctx, doc, alpha * 0.55)
  const { width: W, height: H } = ctx.canvas
  const colour = doc.project.theme.overlay
  const to = 1 - from
  const g = ctx.createLinearGradient(0, 0, 0, H * to)
  g.addColorStop(0, rgba(colour, overlayAlpha(doc, alpha)))
  g.addColorStop(1, rgba(colour, 0))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H * to)
}

/** Flat wash of the overlay colour over the whole slide. */
export function dim(ctx: Ctx, doc: RenderDoc, alpha: number): void {
  ctx.fillStyle = rgba(doc.project.theme.overlay, overlayAlpha(doc, alpha))
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

export function drawHandle(
  ctx: Ctx, doc: RenderDoc, align: CanvasTextAlign,
  x: number, y: number, size: number, alpha: number,
): void {
  const text = doc.project.handle.trim()
  if (!text) return
  ctx.save()
  const pair = fontPair(doc.project.theme.fontPair)
  ctx.font = font(Math.max(...pair.body.weights), size, stack(pair.body))
  // Headings may have left letter spacing on the context.
  ctx.letterSpacing = '0px'
  ctx.textAlign = align
  ctx.fillStyle = rgba(doc.project.theme.text, alpha)
  ctx.shadowColor = 'rgba(0,0,0,.55)'
  ctx.shadowBlur = 8
  ctx.fillText(text, x, y)
  ctx.restore()
}
