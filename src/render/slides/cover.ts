import type { Rect, RenderDoc, Slide } from '../../types'
import { type Ctx, drawBackground, drawHandle, shadeBehindText } from '../draw'
import { typeStyle } from '../style'
import { drawTextBlock, headingLines, placement } from '../text'

export function drawCover(ctx: Ctx, slide: Slide, doc: RenderDoc): Rect | null {
  const { width: W, height: H } = doc
  const ts = typeStyle(doc)
  drawBackground(ctx, doc, slide, 0, 'Drop the cover image here')
  shadeBehindText(ctx, doc, slide.text.anchor, 0.35, 0.7)

  const text = slide.title.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')
  const lines = text
    ? headingLines(ctx, ts, text, W - 170, { start: 210, min: 60, noWrap: true, maxHeight: H * 0.62 })
    : []
  const box = drawTextBlock(ctx, lines, placement(slide, doc), ts)

  drawHandle(ctx, doc, 'center', W / 2, 90, 36, 0.9)
  return box
}
