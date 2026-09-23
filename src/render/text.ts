import { SUB_FONT, TITLE_FONT } from '../constants'
import type { Rect } from '../types'
import { clamp } from './geometry'
import { type Ctx, font } from './draw'

/** Keep text blocks at least this far from the slide edges. */
const SAFE = 60

export interface Segment {
  text: string
  color?: string
  /** Fixed advance instead of the measured width, e.g. a list number column. */
  width?: number
}

export interface TextLine {
  segments: Segment[]
  family: string
  weight: number | ''
  size: number
  color: string
  /** Line box height as a multiple of size. */
  lineHeight: number
  /** 'title' gets the hard accent shadow, 'body' a soft legibility shadow. */
  style: 'title' | 'body'
  gapBefore?: number
  /** Leading space in px, e.g. to hang wrapped list items under their text. */
  indent?: number
}

export type Align = 'left' | 'center' | 'right'
export type Anchor = 'top' | 'middle' | 'bottom'

export interface Placement {
  align: Align
  anchor: Anchor
  /** Point the block is aligned to, in slide pixels. */
  x: number
  y: number
}

export function titleLine(text: string, size: number, gapBefore = 0): TextLine {
  return { segments: [{ text }], family: TITLE_FONT, weight: '', size, color: '#fff', lineHeight: 1.02, style: 'title', gapBefore }
}

export function bodyLine(text: string, size: number, gapBefore = 0, color = 'rgba(255,255,255,.9)'): TextLine {
  return { segments: [{ text }], family: SUB_FONT, weight: 600, size, color, lineHeight: 1.2, style: 'body', gapBefore }
}

/** Word-wrap with the current ctx.font. Newlines in `text` always break. */
export function wrap(ctx: Ctx, text: string, maxWidth: number): string[] {
  const out: string[] = []
  for (const paragraph of text.split('\n')) {
    let current = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = current ? current + ' ' + word : word
      if (!current || ctx.measureText(candidate).width <= maxWidth) current = candidate
      else { out.push(current); current = word }
    }
    if (current) out.push(current)
  }
  return out
}

export interface FitOptions {
  start: number
  min: number
  step?: number
  maxLines?: number
  /** Total height budget for the lines at `lineHeight`. */
  maxHeight?: number
  lineHeight?: number
  /** Only break on newlines. */
  noWrap?: boolean
}

/**
 * Largest size from `start` down to `min` at which `text` fits `maxWidth`
 * within the line and height limits. Returns the `min` layout if nothing fits.
 */
export function fitText(
  ctx: Ctx, text: string, family: string, weight: number | '', maxWidth: number, opts: FitOptions,
): { size: number; lines: string[] } {
  const { start, min, step = 2, maxLines = Infinity, maxHeight = Infinity, lineHeight = 1.2, noWrap = false } = opts
  let best = { size: min, lines: [] as string[] }
  for (let size = start; size >= min; size -= step) {
    ctx.font = font(weight, size, family)
    const lines = noWrap ? text.split('\n').filter(Boolean) : wrap(ctx, text, maxWidth)
    best = { size, lines }
    const fits = lines.length <= maxLines
      && lines.length * size * lineHeight <= maxHeight
      && lines.every((l) => ctx.measureText(l).width <= maxWidth)
    if (fits) return best
  }
  return best
}

function lineWidth(ctx: Ctx, line: TextLine): number {
  ctx.font = font(line.weight, line.size, line.family)
  return line.segments.reduce((w, s) => w + (s.width ?? ctx.measureText(s.text).width), line.indent ?? 0)
}

function blockHeight(lines: TextLine[]): number {
  return lines.reduce((h, l) => h + (l.gapBefore ?? 0) + l.size * l.lineHeight, 0)
}

/** Draw lines as one block, kept inside the safe area. Returns the block's bounds. */
export function drawTextBlock(ctx: Ctx, lines: TextLine[], place: Placement, accent: string): Rect | null {
  if (!lines.length) return null
  const { width: W, height: H } = ctx.canvas
  const widths = lines.map((l) => lineWidth(ctx, l))
  const width = Math.max(...widths)
  const height = blockHeight(lines)

  let top = place.anchor === 'top' ? place.y : place.anchor === 'middle' ? place.y - height / 2 : place.y - height
  let left = place.align === 'left' ? place.x : place.align === 'center' ? place.x - width / 2 : place.x - width
  top = clamp(top, SAFE, Math.max(SAFE, H - SAFE - height))
  left = clamp(left, SAFE, Math.max(SAFE, W - SAFE - width))

  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  let y = top
  lines.forEach((line, i) => {
    y += line.gapBefore ?? 0
    const box = line.size * line.lineHeight
    ctx.font = font(line.weight, line.size, line.family)
    // Centre capitals in the line box so different fonts sit the same way.
    const cap = ctx.measureText('H').actualBoundingBoxAscent
    const baseline = y + box / 2 + cap / 2
    let x = place.align === 'left' ? left : place.align === 'center' ? left + (width - widths[i]) / 2 : left + width - widths[i]
    x += line.indent ?? 0
    for (const seg of line.segments) {
      drawRun(ctx, seg.text, x, baseline, line, seg.color ?? line.color, accent)
      x += seg.width ?? ctx.measureText(seg.text).width
    }
    y += box
  })
  ctx.restore()
  return { x: left, y: top, w: width, h: height }
}

function drawRun(ctx: Ctx, text: string, x: number, y: number, line: TextLine, color: string, accent: string): void {
  if (line.style === 'title') {
    const offset = Math.max(3, Math.round(line.size * 0.06))
    ctx.fillStyle = accent
    ctx.fillText(text, x + offset, y + offset)
    ctx.fillStyle = color
    ctx.fillText(text, x, y)
  } else {
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,.45)'
    ctx.shadowBlur = 8
    ctx.fillStyle = color
    ctx.fillText(text, x, y)
    ctx.restore()
  }
}
