import { SUB_FONT } from '../constants'
import { fontPair, stack } from '../fonts/catalog'
import type { ImageSlot, Rect, RenderDoc, Slide } from '../types'
import { fitImage } from './geometry'

export type Ctx = CanvasRenderingContext2D

/** Editor-only colours for empty image drop zones (never part of a finished slide). */
const PROMPT_BG = '#2a2540'
const PROMPT_TEXT = '#a59fb8'

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

export function slotImage(doc: RenderDoc, slot: ImageSlot | undefined): HTMLImageElement | null {
  return slot?.asset ? doc.images[slot.asset] ?? null : null
}

/** Draw an image cover-fitted, zoomed and panned inside `frame`, clipped to it. */
export function drawSlot(ctx: Ctx, img: HTMLImageElement, slot: ImageSlot, frame: Rect): void {
  const { width, height, marginX, marginY } = fitImage(img, slot.zoom, frame.w, frame.h)
  ctx.save()
  ctx.beginPath()
  ctx.rect(frame.x, frame.y, frame.w, frame.h)
  ctx.clip()
  ctx.drawImage(img, frame.x - marginX + slot.px * marginX, frame.y - marginY + slot.py * marginY, width, height)
  ctx.restore()
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
  if (img) drawSlot(ctx, img, slot, frame)
  else if (emptyText) placeholder(ctx, emptyText, frame)
  else fillBackground(ctx, doc, frame)
  return !!img
}

export function placeholder(ctx: Ctx, text: string, frame = fullFrame(ctx)): void {
  const { x, y, w, h } = frame
  ctx.fillStyle = PROMPT_BG
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = PROMPT_TEXT
  ctx.font = font(600, 52, SUB_FONT)
  ctx.textAlign = 'center'
  ctx.fillText(text, x + w / 2, y + h / 2)
  ctx.textAlign = 'left'
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
  ctx.textAlign = align
  ctx.fillStyle = rgba(doc.project.theme.text, alpha)
  ctx.shadowColor = 'rgba(0,0,0,.55)'
  ctx.shadowBlur = 8
  ctx.fillText(text, x, y)
  ctx.restore()
}
