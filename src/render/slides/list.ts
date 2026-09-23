import type { Rect, RenderDoc, Slide } from '../../types'
import { type Ctx, dim, drawBackground, drawHandle } from '../draw'
import { type TypeStyle, typeStyle } from '../style'
import { type TextLine, blockHeight, bodyLine, drawTextBlock, headingLines, setFont, wrap, placement } from '../text'

/** Numbered items, wrapped lines hanging under the item text. */
function itemLines(ctx: Ctx, ts: TypeStyle, items: string[], size: number, maxWidth: number): TextLine[] {
  setFont(ctx, ts.body, size)
  const column = ctx.measureText(`${items.length}.  `).width
  const out: TextLine[] = []
  items.forEach((item, i) => {
    wrap(ctx, item, maxWidth - column).forEach((text, j) => {
      const line = bodyLine(ts, text, size, { bold: false, gapBefore: j === 0 && i > 0 ? size * 0.4 : 0 })
      if (j === 0) line.segments = [{ text: `${i + 1}.`, color: ts.accent, width: column }, { text }]
      else line.indent = column
      out.push(line)
    })
  })
  return out
}

export function drawList(ctx: Ctx, slide: Slide, doc: RenderDoc): Rect | null {
  const { width: W, height: H } = doc
  const ts = typeStyle(doc)
  if (drawBackground(ctx, doc, slide, 0, null)) dim(ctx, doc, 0.6)

  const lines: TextLine[] = []
  const title = slide.title.trim()
  if (title) lines.push(...headingLines(ctx, ts, title, W - 160, { start: 110, min: 56, step: 4, maxLines: 3 }))

  const items = slide.body.split('\n').map((l) => l.trim()).filter(Boolean)
  if (items.length) {
    // Shrink until every item fits in the space left under the heading.
    const min = Math.round(26 * ts.bodyScale)
    let size = Math.round(48 * ts.bodyScale)
    let body = itemLines(ctx, ts, items, size, W - 160)
    while (size > min && blockHeight(body) > H * 0.6) {
      size -= 2
      body = itemLines(ctx, ts, items, size, W - 160)
    }
    if (lines.length) body[0].gapBefore = 40
    lines.push(...body)
  }
  const box = drawTextBlock(ctx, lines, placement(slide, doc), ts)

  drawHandle(ctx, doc, 'right', W - 60, 80, 30, 0.75)
  return box
}
