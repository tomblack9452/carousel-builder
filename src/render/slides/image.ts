import type { RenderDoc, Slide } from '../../types'
import { type Ctx, drawBackground, drawHandle, shade } from '../draw'
import { typeStyle } from '../style'
import { type TextLine, bodyLines, drawTextBlock, headingLines } from '../text'

export function drawImage(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H } = doc
  const ts = typeStyle(doc)
  drawBackground(ctx, doc, slide, 0, 'Drop an image here')
  shade(ctx, doc, 0.55, 0.75)

  const lines: TextLine[] = []
  const title = slide.title.trim()
  if (title) lines.push(...headingLines(ctx, ts, title, W - 170, { start: 96, min: 44, maxLines: 2 }))
  const body = slide.body.trim()
  if (body) {
    lines.push(...bodyLines(ctx, ts, body, W - 170, {
      start: 38, min: 28, maxLines: 2, gapBefore: lines.length ? 6 : 0, alpha: 0.88,
    }))
  }
  drawTextBlock(ctx, lines, { align: 'left', anchor: 'bottom', x: 80, y: H - 70 }, ts)

  drawHandle(ctx, doc, 'right', W - 60, 80, 30, 0.75)
}
