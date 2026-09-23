import type { Align, Anchor, Rect, RenderDoc, Slide } from '../types'
import { clamp } from './geometry'
import { type Ctx, rgba } from './draw'
import type { Face, TypeStyle } from './style'

/** Keep text blocks at least this far from the slide edges. */
export const TEXT_SAFE = 60

export interface Segment {
  text: string
  color?: string
  /** Fixed advance instead of the measured width, e.g. a list number column. */
  width?: number
}

export interface TextLine {
  segments: Segment[]
  face: Face
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

export interface Placement {
  align: Align
  anchor: Anchor
  /** Point the block is aligned to, in slide pixels. */
  x: number
  y: number
}

/** A slide's stored text layout in slide pixels. */
export function placement(slide: Slide, doc: RenderDoc): Placement {
  const { align, anchor, x, y } = slide.text
  return { align, anchor, x: x * doc.width, y: y * doc.height }
}

export function setFont(ctx: Ctx, face: Face, size: number): void {
  ctx.font = `${face.weight} ${size}px ${face.family}`
  ctx.letterSpacing = `${face.letterSpacing * size}px`
}

export function titleLine(ts: TypeStyle, text: string, size: number, gapBefore = 0): TextLine {
  return { segments: [{ text }], face: ts.heading, size, color: ts.text, lineHeight: 1.05, style: 'title', gapBefore }
}

export interface BodyOptions {
  gapBefore?: number
  /** Opacity of the theme text colour. */
  alpha?: number
  bold?: boolean
}

export function bodyLine(ts: TypeStyle, text: string, size: number, opts: BodyOptions = {}): TextLine {
  return {
    segments: [{ text }],
    face: opts.bold === false ? ts.body : ts.bodyBold,
    size,
    color: rgba(ts.text, opts.alpha ?? 0.9),
    lineHeight: 1.25,
    style: 'body',
    gapBefore: opts.gapBefore ?? 0,
  }
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
export function fitText(ctx: Ctx, text: string, face: Face, maxWidth: number, opts: FitOptions): { size: number; lines: string[] } {
  const { start, min, step = 2, maxLines = Infinity, maxHeight = Infinity, lineHeight = 1.2, noWrap = false } = opts
  let best = { size: min, lines: [] as string[] }
  for (let size = Math.round(start); size >= min; size -= step) {
    setFont(ctx, face, size)
    const lines = noWrap ? text.split('\n').filter(Boolean) : wrap(ctx, text, maxWidth)
    best = { size, lines }
    const fits = lines.length <= maxLines
      && lines.length * size * lineHeight <= maxHeight
      && lines.every((l) => ctx.measureText(l).width <= maxWidth)
    if (fits) return best
  }
  // A line too long for the slide even at the smallest size: wrap it rather than run off the edge.
  if (noWrap) return fitText(ctx, text, face, maxWidth, { ...opts, noWrap: false })
  return best
}

/** Fit heading text, applying the theme's case and size scale. */
export function headingLines(ctx: Ctx, ts: TypeStyle, text: string, maxWidth: number, opts: FitOptions): TextLine[] {
  const fit = fitText(ctx, ts.caps(text), ts.heading, maxWidth, {
    lineHeight: 1.05,
    ...opts,
    start: opts.start * ts.headingScale,
    min: opts.min * ts.headingScale,
  })
  return fit.lines.map((l) => titleLine(ts, l, fit.size))
}

/** Fit body text, applying the theme's size scale. */
export function bodyLines(ctx: Ctx, ts: TypeStyle, text: string, maxWidth: number, opts: FitOptions & BodyOptions): TextLine[] {
  const face = opts.bold === false ? ts.body : ts.bodyBold
  const fit = fitText(ctx, text, face, maxWidth, {
    lineHeight: 1.25,
    ...opts,
    start: opts.start * ts.bodyScale,
    min: opts.min * ts.bodyScale,
  })
  return fit.lines.map((l, i) => bodyLine(ts, l, fit.size, { ...opts, gapBefore: i === 0 ? opts.gapBefore : 0 }))
}

function lineWidth(ctx: Ctx, line: TextLine): number {
  setFont(ctx, line.face, line.size)
  return line.segments.reduce((w, s) => w + (s.width ?? ctx.measureText(s.text).width), line.indent ?? 0)
}

export function blockHeight(lines: TextLine[]): number {
  return lines.reduce((h, l) => h + (l.gapBefore ?? 0) + l.size * l.lineHeight, 0)
}

/** Draw lines as one block, kept inside the safe area. Returns the block's bounds. */
export function drawTextBlock(ctx: Ctx, lines: TextLine[], place: Placement, ts: TypeStyle): Rect | null {
  if (!lines.length) return null
  const { width: W, height: H } = ctx.canvas
  const widths = lines.map((l) => lineWidth(ctx, l))
  const width = Math.max(...widths)
  const height = blockHeight(lines)

  let top = place.anchor === 'top' ? place.y : place.anchor === 'middle' ? place.y - height / 2 : place.y - height
  let left = place.align === 'left' ? place.x : place.align === 'center' ? place.x - width / 2 : place.x - width
  top = clamp(top, TEXT_SAFE, Math.max(TEXT_SAFE, H - TEXT_SAFE - height))
  left = clamp(left, TEXT_SAFE, Math.max(TEXT_SAFE, W - TEXT_SAFE - width))

  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  let y = top
  lines.forEach((line, i) => {
    y += line.gapBefore ?? 0
    const box = line.size * line.lineHeight
    setFont(ctx, line.face, line.size)
    // Centre capitals in the line box so different fonts sit the same way.
    const cap = ctx.measureText('H').actualBoundingBoxAscent
    const baseline = y + box / 2 + cap / 2
    let x = place.align === 'left' ? left : place.align === 'center' ? left + (width - widths[i]) / 2 : left + width - widths[i]
    x += line.indent ?? 0
    for (const seg of line.segments) {
      drawRun(ctx, seg.text, x, baseline, line, seg.color ?? line.color, ts)
      x += seg.width ?? ctx.measureText(seg.text).width
    }
    y += box
  })
  ctx.restore()
  return { x: left, y: top, w: width, h: height }
}

function drawRun(ctx: Ctx, text: string, x: number, y: number, line: TextLine, color: string, ts: TypeStyle): void {
  if (line.style === 'title' && ts.titleEffect === 'hard') {
    const offset = Math.max(3, Math.round(line.size * 0.06))
    ctx.fillStyle = ts.accent
    ctx.fillText(text, x + offset, y + offset)
    ctx.fillStyle = color
    ctx.fillText(text, x, y)
  } else if (line.style === 'title' && ts.titleEffect === 'glow') {
    ctx.save()
    ctx.shadowColor = ts.accent
    ctx.shadowBlur = line.size * 0.35
    ctx.fillStyle = color
    // Two passes build a stronger glow.
    ctx.fillText(text, x, y)
    ctx.fillText(text, x, y)
    ctx.restore()
  } else {
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,.45)'
    ctx.shadowBlur = 8
    ctx.fillStyle = color
    ctx.fillText(text, x, y)
    ctx.restore()
  }
}
