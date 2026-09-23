import type { ImageSlot, RenderDoc, Slide } from '../../types'
import { type Ctx, drawHandle, drawSlot, fillBackground, slotImage } from '../draw'
import { typeStyle } from '../style'
import { type TextLine, bodyLines, drawTextBlock, headingLines } from '../text'

/** The slot to blur behind a call to action: its own image, else the cover's, else the first image slide's. */
export function backgroundSlot(slide: Slide, doc: RenderDoc): ImageSlot | undefined {
  if (slotImage(doc, slide.images[0])) return slide.images[0]
  const slides = doc.project.slides
  const from = slides.find((s) => s.type === 'cover' && slotImage(doc, s.images[0]))
    ?? slides.find((s) => s.type === 'image' && slotImage(doc, s.images[0]))
  return from?.images[0]
}

export function drawCta(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H } = doc
  const ts = typeStyle(doc)
  const slot = backgroundSlot(slide, doc)
  const img = slotImage(doc, slot)
  if (slot && img) {
    ctx.save()
    ctx.filter = 'blur(28px) brightness(.5)'
    // Scale up slightly so the blur doesn't leave soft edges.
    ctx.translate(W / 2, H / 2)
    ctx.scale(1.12, 1.12)
    ctx.translate(-W / 2, -H / 2)
    drawSlot(ctx, img, slot, { x: 0, y: 0, w: W, h: H })
    ctx.restore()
  } else {
    fillBackground(ctx, doc)
  }

  const lines: TextLine[] = []
  const title = slide.title.trim()
  if (title) lines.push(...headingLines(ctx, ts, title, W - 200, { start: 160, min: 70, step: 4, maxLines: 3 }))
  const body = slide.body.trim()
  if (body) {
    lines.push(...bodyLines(ctx, ts, body, W - 240, { start: 48, min: 30, step: 4, maxLines: 2, gapBefore: lines.length ? 24 : 0 }))
  }
  drawTextBlock(ctx, lines, { align: 'center', anchor: 'middle', x: W / 2, y: H * 0.47 }, ts)

  drawHandle(ctx, doc, 'center', W / 2, H - 90, 36, 0.9)
}
