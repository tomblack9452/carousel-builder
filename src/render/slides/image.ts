import { TITLE_FONT } from '../../constants'
import type { RenderDoc, Slide } from '../../types'
import { type Ctx, drawBackground, drawHandle, shade } from '../draw'
import { type TextLine, bodyLine, drawTextBlock, fitText, titleLine } from '../text'

export function drawImage(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H, project } = doc
  drawBackground(ctx, doc, slide, 0, 'Drop a screenshot here')
  shade(ctx, 0.55, 0.75)

  const lines: TextLine[] = []
  const title = slide.title.trim()
  if (title) {
    const { size } = fitText(ctx, title, TITLE_FONT, '', W - 170, { start: 96, min: 44, noWrap: true })
    lines.push(titleLine(title, size))
  }
  const body = slide.body.trim()
  if (body) lines.push(bodyLine(body, 38, lines.length ? 6 : 0, 'rgba(255,255,255,.88)'))
  drawTextBlock(ctx, lines, { align: 'left', anchor: 'bottom', x: 80, y: H - 70 }, project.accent)

  drawHandle(ctx, project.handle, 'right', W - 60, 80, 30, 0.75)
}
