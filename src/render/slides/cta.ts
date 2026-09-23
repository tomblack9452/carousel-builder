import { SUB_FONT, TITLE_FONT } from '../../constants'
import type { ImageSlot, RenderDoc, Slide } from '../../types'
import { type Ctx, drawHandle, drawSlot, font, hardText, slotImage, wrapFit } from '../draw'

/** The slot to blur behind a call to action: its own image, else the cover's, else the first image slide's. */
export function backgroundSlot(slide: Slide, doc: RenderDoc): ImageSlot | undefined {
  if (slotImage(doc, slide.images[0])) return slide.images[0]
  const slides = doc.project.slides
  const from = slides.find((s) => s.type === 'cover' && slotImage(doc, s.images[0]))
    ?? slides.find((s) => s.type === 'image' && slotImage(doc, s.images[0]))
  return from?.images[0]
}

export function drawCta(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H, project } = doc
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
    ctx.fillStyle = '#2a2540'
    ctx.fillRect(0, 0, W, H)
  }

  ctx.textAlign = 'center'
  const title = slide.title.trim().toUpperCase()
  let y = H * 0.44
  if (title) {
    const { size, lines } = wrapFit(ctx, title, '', TITLE_FONT, W - 200, 160, 70, 3)
    ctx.font = font('', size, TITLE_FONT)
    const lineHeight = size * 1.02
    y = H * 0.44 - ((lines.length - 1) * lineHeight) / 2
    for (const line of lines) {
      hardText(ctx, line, W / 2, y, Math.round(size * 0.06), project.accent)
      y += lineHeight
    }
  }

  const body = slide.body.trim()
  if (body) {
    const { size, lines } = wrapFit(ctx, body, 600, SUB_FONT, W - 240, 48, 30, 2)
    ctx.font = font(600, size, SUB_FONT)
    ctx.fillStyle = 'rgba(255,255,255,.9)'
    let subY = y + 20
    for (const line of lines) {
      ctx.fillText(line, W / 2, subY)
      subY += size * 1.2
    }
  }

  drawHandle(ctx, project.handle, 'center', W / 2, H - 90, 36, 0.9)
}
