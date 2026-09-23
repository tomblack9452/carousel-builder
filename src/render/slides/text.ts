import type { RenderDoc, Slide } from '../../types'
import { type Ctx, dim, drawBackground, drawHandle } from '../draw'
import { typeStyle } from '../style'
import { type TextLine, bodyLines, drawTextBlock, headingLines } from '../text'

export function drawText(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H } = doc
  const ts = typeStyle(doc)
  if (drawBackground(ctx, doc, slide, 0, null)) dim(ctx, doc, 0.6)

  const lines: TextLine[] = []
  const title = slide.title.trim()
  if (title) lines.push(...headingLines(ctx, ts, title, W - 160, { start: 120, min: 56, step: 4, maxLines: 4 }))
  const body = slide.body.trim()
  if (body) {
    lines.push(...bodyLines(ctx, ts, body, W - 160, {
      start: 46, min: 26, maxHeight: H * 0.55, bold: false, gapBefore: lines.length ? 36 : 0,
    }))
  }
  drawTextBlock(ctx, lines, { align: 'left', anchor: 'middle', x: 80, y: H / 2 }, ts)

  drawHandle(ctx, doc, 'right', W - 60, 80, 30, 0.75)
}
