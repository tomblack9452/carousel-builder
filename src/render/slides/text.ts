import { SUB_FONT, TITLE_FONT } from '../../constants'
import type { RenderDoc, Slide } from '../../types'
import { type Ctx, dim, drawBackground, drawHandle } from '../draw'
import { type TextLine, bodyLine, drawTextBlock, fitText, titleLine } from '../text'

export function drawText(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H, project } = doc
  if (drawBackground(ctx, doc, slide, 0, null)) dim(ctx, 0.6)

  const lines: TextLine[] = []
  const title = slide.title.trim().toUpperCase()
  if (title) {
    const fit = fitText(ctx, title, TITLE_FONT, '', W - 160, { start: 120, min: 56, step: 4, maxLines: 4 })
    lines.push(...fit.lines.map((l) => titleLine(l, fit.size)))
  }
  const body = slide.body.trim()
  if (body) {
    const fit = fitText(ctx, body, SUB_FONT, 600, W - 160, { start: 46, min: 26, maxHeight: H * 0.55 })
    fit.lines.forEach((l, i) => lines.push(bodyLine(l, fit.size, i === 0 && lines.length ? 36 : 0)))
  }
  drawTextBlock(ctx, lines, { align: 'left', anchor: 'middle', x: 80, y: H / 2 }, project.accent)

  drawHandle(ctx, project.handle, 'right', W - 60, 80, 30, 0.75)
}
