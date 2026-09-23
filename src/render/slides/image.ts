import { SUB_FONT, TITLE_FONT } from '../../constants'
import type { RenderDoc, Slide } from '../../types'
import { type Ctx, drawHandle, drawSlot, fitSize, font, hardText, placeholder, shade, slotImage } from '../draw'

export function drawImage(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { width: W, height: H, project } = doc
  const img = slotImage(doc, slide.images[0])
  if (img) drawSlot(ctx, img, slide.images[0], { x: 0, y: 0, w: W, h: H })
  else placeholder(ctx, 'Drop a screenshot here')
  shade(ctx, 0.55, 0.75)

  const title = slide.title.trim()
  const body = slide.body.trim()

  if (title) {
    const size = fitSize(ctx, [title], '', TITLE_FONT, W - 170, 96, 44)
    ctx.font = font('', size, TITLE_FONT)
    hardText(ctx, title, 80, body ? H - 150 : H - 100, Math.max(3, Math.round(size * 0.06)), project.accent)
  }
  if (body) {
    ctx.font = font(600, 38, SUB_FONT)
    ctx.fillStyle = 'rgba(255,255,255,.88)'
    ctx.fillText(body, 82, H - 92)
  }

  drawHandle(ctx, project.handle, 'right', W - 60, 80, 30, 0.75)
}
