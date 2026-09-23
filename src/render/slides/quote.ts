import { SUB_FONT, TITLE_FONT } from '../../constants'
import type { RenderDoc, Slide } from '../../types'
import { type Ctx, dim, drawBackground, drawHandle } from '../draw'
import { type TextLine, bodyLine, drawTextBlock, fitText, titleLine } from '../text'

export function drawQuote(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H, project } = doc
  if (drawBackground(ctx, doc, slide, 0, null)) dim(ctx, 0.6)

  const lines: TextLine[] = []
  const quote = slide.title.trim().toUpperCase()
  if (quote) {
    // Big opening mark in the accent colour, tight line box so it doesn't push the text down.
    lines.push({ ...titleLine('“', 220), color: project.accent, style: 'body', lineHeight: 0.55 })
    const fit = fitText(ctx, quote, TITLE_FONT, '', W - 200, { start: 110, min: 48, step: 4, maxLines: 7, maxHeight: H * 0.55 })
    fit.lines.forEach((l, i) => lines.push(titleLine(l, fit.size, i === 0 ? 20 : 0)))
  }
  const by = slide.body.trim()
  if (by) {
    const fit = fitText(ctx, `— ${by}`, SUB_FONT, 600, W - 240, { start: 42, min: 28, maxLines: 2 })
    fit.lines.forEach((l, i) => lines.push(bodyLine(l, fit.size, i === 0 && lines.length ? 36 : 0, 'rgba(255,255,255,.8)')))
  }
  drawTextBlock(ctx, lines, { align: 'center', anchor: 'middle', x: W / 2, y: H / 2 }, project.accent)

  drawHandle(ctx, project.handle, 'center', W / 2, H - 80, 32, 0.8)
}
