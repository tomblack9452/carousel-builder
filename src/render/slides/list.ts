import { SUB_FONT, TITLE_FONT } from '../../constants'
import type { RenderDoc, Slide } from '../../types'
import { type Ctx, dim, drawBackground, drawHandle, font } from '../draw'
import { type TextLine, bodyLine, drawTextBlock, fitText, titleLine, wrap } from '../text'

/** Numbered items, wrapped lines hanging under the item text. */
function itemLines(ctx: Ctx, items: string[], size: number, maxWidth: number, accent: string): TextLine[] {
  ctx.font = font(600, size, SUB_FONT)
  const column = ctx.measureText(`${items.length}.  `).width
  const out: TextLine[] = []
  items.forEach((item, i) => {
    wrap(ctx, item, maxWidth - column).forEach((text, j) => {
      const line = bodyLine(text, size, j === 0 && i > 0 ? size * 0.4 : 0)
      if (j === 0) line.segments = [{ text: `${i + 1}.`, color: accent, width: column }, { text }]
      else line.indent = column
      out.push(line)
    })
  })
  return out
}

export function drawList(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H, project } = doc
  if (drawBackground(ctx, doc, slide, 0, null)) dim(ctx, 0.6)

  const lines: TextLine[] = []
  const title = slide.title.trim().toUpperCase()
  if (title) {
    const fit = fitText(ctx, title, TITLE_FONT, '', W - 160, { start: 110, min: 56, step: 4, maxLines: 3 })
    lines.push(...fit.lines.map((l) => titleLine(l, fit.size)))
  }

  const items = slide.body.split('\n').map((l) => l.trim()).filter(Boolean)
  if (items.length) {
    // Shrink until every item fits in the space left under the heading.
    let size = 48
    let body = itemLines(ctx, items, size, W - 160, project.accent)
    const budget = H * 0.6
    while (size > 26 && body.reduce((h, l) => h + (l.gapBefore ?? 0) + l.size * l.lineHeight, 0) > budget) {
      size -= 2
      body = itemLines(ctx, items, size, W - 160, project.accent)
    }
    if (lines.length) body[0].gapBefore = 40
    lines.push(...body)
  }
  drawTextBlock(ctx, lines, { align: 'left', anchor: 'middle', x: 80, y: H / 2 }, project.accent)

  drawHandle(ctx, project.handle, 'right', W - 60, 80, 30, 0.75)
}
