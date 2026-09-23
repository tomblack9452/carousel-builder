import { TITLE_FONT } from '../../constants'
import type { RenderDoc, Slide } from '../../types'
import { type Ctx, drawBackground, drawHandle, shade } from '../draw'
import { drawTextBlock, fitText, titleLine } from '../text'

export function drawCover(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H, project } = doc
  drawBackground(ctx, doc, slide, 0, 'Drop the cover image here')
  shade(ctx, 0.35, 0.7)

  const text = slide.title.split('\n').map((l) => l.trim()).filter(Boolean).join('\n').toUpperCase()
  if (text) {
    const { size, lines } = fitText(ctx, text, TITLE_FONT, '', W - 170, {
      start: 210, min: 60, noWrap: true, maxHeight: H * 0.62, lineHeight: 1.02,
    })
    drawTextBlock(ctx, lines.map((l) => titleLine(l, size)), { align: 'left', anchor: 'bottom', x: 80, y: H - 90 }, project.accent)
  }

  drawHandle(ctx, project.handle, 'center', W / 2, 90, 36, 0.9)
}
