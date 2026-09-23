import { SUB_FONT, TITLE_FONT } from '../../constants'
import type { Rect, RenderDoc, Slide } from '../../types'
import { type Ctx, drawBackground, drawHandle, font } from '../draw'
import { drawTextBlock, fitText, titleLine } from '../text'

/** Before on top, after underneath. */
export function compareFrames(w: number, h: number): Rect[] {
  return [
    { x: 0, y: 0, w, h: h / 2 },
    { x: 0, y: h / 2, w, h: h / 2 },
  ]
}

function drawTag(ctx: Ctx, text: string, x: number, y: number, accent: string): void {
  ctx.save()
  ctx.font = font(600, 40, SUB_FONT)
  const padX = 22
  const w = ctx.measureText(text).width + padX * 2
  const h = 60
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + padX, y + h / 2 + 2)
  ctx.restore()
}

export function drawCompare(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H, project } = doc
  const frames = compareFrames(W, H)
  const prompts = ['Drop the before image', 'Drop the after image']
  frames.forEach((frame, i) => drawBackground(ctx, doc, slide, i, prompts[i], frame))

  // Divider along the seam.
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, H / 2 - 3, W, 6)

  const labels = slide.body.split('\n').map((l) => l.trim()).filter(Boolean)
  frames.forEach((frame, i) => {
    if (labels[i]) drawTag(ctx, labels[i].toUpperCase(), 48, frame.y + 48, project.accent)
  })

  const title = slide.title.trim().toUpperCase()
  if (title) {
    const fit = fitText(ctx, title, TITLE_FONT, '', W - 160, { start: 120, min: 56, step: 4, maxLines: 2 })
    drawTextBlock(ctx, fit.lines.map((l) => titleLine(l, fit.size)), { align: 'center', anchor: 'middle', x: W / 2, y: H / 2 }, project.accent)
  }

  drawHandle(ctx, project.handle, 'right', W - 60, 80, 30, 0.75)
}
