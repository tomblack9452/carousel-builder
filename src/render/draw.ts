import { SUB_FONT } from '../constants'
import { fontPair, stack } from '../fonts/catalog'
import type { ImageSlot, Rect, RenderDoc, Slide } from '../types'
import { fitImage } from './geometry'

export type Ctx = CanvasRenderingContext2D

const EMPTY_BG = '#2a2540'

export function font(weight: number | '', size: number, family: string): string {
  return `${weight ? weight + ' ' : ''}${size}px ${family}`
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

/**
 * Draw a slot's image into its frame. When it's empty, show `emptyText` as a
 * drop prompt, or a plain background if the image is optional (null).
 * Returns whether an image was drawn.
 */
export function drawBackground(
  ctx: Ctx, doc: RenderDoc, slide: Slide, slotIndex: number, emptyText: string | null, frame = fullFrame(ctx),
): boolean {
  const slot = slide.images[slotIndex]
  const img = slotImage(doc, slot)
  if (img) drawSlot(ctx, img, slot, frame)
  else if (emptyText) placeholder(ctx, emptyText, frame)
  else {
    ctx.fillStyle = EMPTY_BG
    ctx.fillRect(frame.x, frame.y, frame.w, frame.h)
  }
  return !!img
}

export function placeholder(ctx: Ctx, text: string, frame = fullFrame(ctx)): void {
  const { x, y, w, h } = frame
  ctx.fillStyle = EMPTY_BG
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#a59fb8'
  ctx.font = font(600, 52, SUB_FONT)
  ctx.textAlign = 'center'
  ctx.fillText(text, x + w / 2, y + h / 2)
  ctx.textAlign = 'left'
}

/** Dark gradient from `from` (fraction of height) to the bottom edge, for text legibility. */
export function shade(ctx: Ctx, from: number, alpha: number): void {
  const { width: W, height: H } = ctx.canvas
  const g = ctx.createLinearGradient(0, H * from, 0, H)
  g.addColorStop(0, 'rgba(18,10,28,0)')
  g.addColorStop(1, `rgba(18,10,28,${alpha})`)
  ctx.fillStyle = g
  ctx.fillRect(0, H * from, W, H * (1 - from))
}

/** Flat dark wash over the whole slide. */
export function dim(ctx: Ctx, alpha: number): void {
  ctx.fillStyle = `rgba(18,10,28,${alpha})`
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
  ctx.fillStyle = `rgba(255,255,255,${alpha})`
  ctx.shadowColor = 'rgba(0,0,0,.55)'
  ctx.shadowBlur = 8
  ctx.fillText(text, x, y)
  ctx.restore()
}
