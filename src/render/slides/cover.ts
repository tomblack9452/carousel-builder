import type { RenderDoc, Slide } from '../../types'
import { type Ctx, drawBackground, drawHandle, shade } from '../draw'
import { typeStyle } from '../style'
import { drawTextBlock, headingLines } from '../text'

export function drawCover(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H } = doc
  const ts = typeStyle(doc)
  drawBackground(ctx, doc, slide, 0, 'Drop the cover image here')
  shade(ctx, 0.35, 0.7)

  const text = slide.title.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')
  const lines = text
    ? headingLines(ctx, ts, text, W - 170, { start: 210, min: 60, noWrap: true, maxHeight: H * 0.62 })
    : []
  drawTextBlock(ctx, lines, { align: 'left', anchor: 'bottom', x: 80, y: H - 90 }, ts.accent)

  drawHandle(ctx, doc, 'center', W / 2, 90, 36, 0.9)
}
