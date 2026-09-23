import type { RenderDoc, Slide } from '../../types'
import { type Ctx, dim, drawBackground, drawHandle } from '../draw'
import { typeStyle } from '../style'
import { type TextLine, bodyLines, drawTextBlock, headingLines, titleLine } from '../text'

export function drawQuote(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H } = doc
  const ts = typeStyle(doc)
  if (drawBackground(ctx, doc, slide, 0, null)) dim(ctx, doc, 0.6)

  const lines: TextLine[] = []
  const quote = slide.title.trim()
  if (quote) {
    // Big opening mark in the accent colour, tight line box so it doesn't push the text down.
    lines.push({ ...titleLine(ts, '“', 220 * ts.headingScale), color: ts.accent, style: 'body', lineHeight: 0.55 })
    const text = headingLines(ctx, ts, quote, W - 200, { start: 110, min: 48, step: 4, maxLines: 7, maxHeight: H * 0.55 })
    text[0].gapBefore = 20
    lines.push(...text)
  }
  const by = slide.body.trim()
  if (by) {
    lines.push(...bodyLines(ctx, ts, `— ${by}`, W - 240, {
      start: 42, min: 28, maxLines: 2, gapBefore: lines.length ? 36 : 0, alpha: 0.8,
    }))
  }
  drawTextBlock(ctx, lines, { align: 'center', anchor: 'middle', x: W / 2, y: H / 2 }, ts)

  drawHandle(ctx, doc, 'center', W / 2, H - 80, 32, 0.8)
}
