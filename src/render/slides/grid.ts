import type { Rect, RenderDoc, Slide } from '../../types'
import { type Ctx, drawBackground, drawHandle, fillBackground } from '../draw'
import { typeStyle } from '../style'
import { drawTextBlock, headingLines, placement } from '../text'

/** Space between cells, showing the theme background. */
const GAP = 12

export function grid2Frames(w: number, h: number): Rect[] {
  const cw = (w - GAP) / 2
  return [
    { x: 0, y: 0, w: cw, h },
    { x: cw + GAP, y: 0, w: cw, h },
  ]
}

/** One tall image on the left, two stacked on the right. */
export function grid3Frames(w: number, h: number): Rect[] {
  const cw = (w - GAP) / 2
  const ch = (h - GAP) / 2
  return [
    { x: 0, y: 0, w: cw, h },
    { x: cw + GAP, y: 0, w: cw, h: ch },
    { x: cw + GAP, y: ch + GAP, w: cw, h: ch },
  ]
}

export function grid4Frames(w: number, h: number): Rect[] {
  const cw = (w - GAP) / 2
  const ch = (h - GAP) / 2
  return [
    { x: 0, y: 0, w: cw, h: ch },
    { x: cw + GAP, y: 0, w: cw, h: ch },
    { x: 0, y: ch + GAP, w: cw, h: ch },
    { x: cw + GAP, y: ch + GAP, w: cw, h: ch },
  ]
}

const FRAMES = { grid2: grid2Frames, grid3: grid3Frames, grid4: grid4Frames } as const

export function drawGrid(ctx: Ctx, slide: Slide, doc: RenderDoc): Rect | null {
  const { width: W, height: H } = doc
  const ts = typeStyle(doc)
  fillBackground(ctx, doc)
  const frames = FRAMES[slide.type as keyof typeof FRAMES](W, H)
  frames.forEach((frame, i) => drawBackground(ctx, doc, slide, i, `Image ${i + 1}`, frame))

  const title = slide.title.trim()
  const lines = title ? headingLines(ctx, ts, title, W - 160, { start: 110, min: 50, step: 4, maxLines: 2 }) : []
  const box = drawTextBlock(ctx, lines, placement(slide, doc), ts)

  drawHandle(ctx, doc, 'right', W - 60, 80, 30, 0.75)
  return box
}
