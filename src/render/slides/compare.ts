import type { Rect, RenderDoc, Slide } from '../../types'
import { type Ctx, drawBackground, drawHandle, isLight } from '../draw'
import { type TypeStyle, typeStyle } from '../style'
import { drawTextBlock, headingLines, setFont, placement } from '../text'

/** Before on top, after underneath. */
export function compareFrames(w: number, h: number): Rect[] {
  return [
    { x: 0, y: 0, w, h: h / 2 },
    { x: 0, y: h / 2, w, h: h / 2 },
  ]
}

function drawTag(ctx: Ctx, ts: TypeStyle, text: string, x: number, y: number): void {
  ctx.save()
  setFont(ctx, ts.bodyBold, 40)
  const padX = 22
  const w = ctx.measureText(text).width + padX * 2
  const h = 60
  ctx.fillStyle = ts.accent
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.fill()
  ctx.fillStyle = isLight(ts.accent) ? '#111' : '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + padX, y + h / 2 + 2)
  ctx.restore()
}

export function drawCompare(ctx: Ctx, slide: Slide, doc: RenderDoc): Rect | null {
  const { width: W, height: H } = doc
  const ts = typeStyle(doc)
  const frames = compareFrames(W, H)
  const prompts = ['Drop the before image', 'Drop the after image']
  frames.forEach((frame, i) => drawBackground(ctx, doc, slide, i, prompts[i], frame))

  // Divider along the seam.
  ctx.fillStyle = ts.text
  ctx.fillRect(0, H / 2 - 3, W, 6)

  const labels = slide.body.split('\n').map((l) => l.trim()).filter(Boolean)
  frames.forEach((frame, i) => {
    if (labels[i]) drawTag(ctx, ts, labels[i].toUpperCase(), 48, frame.y + 48)
  })

  const title = slide.title.trim()
  const lines = title ? headingLines(ctx, ts, title, W - 160, { start: 120, min: 56, step: 4, maxLines: 2 }) : []
  const box = drawTextBlock(ctx, lines, placement(slide, doc), ts)

  drawHandle(ctx, doc, 'right', W - 60, 80, 30, 0.75)
  return box
}
