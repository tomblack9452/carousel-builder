import { W, H, SUB_FONT, TITLE_FONT } from '../../constants'
import type { RenderDoc, Slide } from '../../types'
import { type Ctx, drawHandle, drawSlideImage, font, hardText, wrapFit } from '../draw'

/** The image the end slide blurs: the cover's, else the first game screenshot. */
export function backgroundSource(slides: Slide[]): Slide | undefined {
  return slides.find((s) => s.type === 'cover' && s.img) ?? slides.find((s) => s.type === 'game' && s.img)
}

export function drawEnd(ctx: Ctx, _slide: Slide, { settings, slides }: RenderDoc): void {
  const source = backgroundSource(slides)
  if (source) {
    ctx.save()
    ctx.filter = 'blur(28px) brightness(.5)'
    // Scale up slightly so the blur doesn't leave soft edges.
    ctx.translate(W / 2, H / 2)
    ctx.scale(1.12, 1.12)
    ctx.translate(-W / 2, -H / 2)
    drawSlideImage(ctx, source)
    ctx.restore()
  } else {
    ctx.fillStyle = '#2a2540'
    ctx.fillRect(0, 0, W, H)
  }

  ctx.textAlign = 'center'
  const title = settings.endTitle.trim().toUpperCase()
  let y = H * 0.44
  if (title) {
    const { size, lines } = wrapFit(ctx, title, '', TITLE_FONT, W - 200, 160, 70, 3)
    ctx.font = font('', size, TITLE_FONT)
    const lineHeight = size * 1.02
    y = H * 0.44 - ((lines.length - 1) * lineHeight) / 2
    for (const line of lines) {
      hardText(ctx, line, W / 2, y, Math.round(size * 0.06), settings.shadow)
      y += lineHeight
    }
  }

  const sub = settings.endSub.trim()
  if (sub) {
    const { size, lines } = wrapFit(ctx, sub, 600, SUB_FONT, W - 240, 48, 30, 2)
    ctx.font = font(600, size, SUB_FONT)
    ctx.fillStyle = 'rgba(255,255,255,.9)'
    let subY = y + 20
    for (const line of lines) {
      ctx.fillText(line, W / 2, subY)
      subY += size * 1.2
    }
  }

  drawHandle(ctx, settings.handle, 'center', W / 2, H - 90, 36, 0.9)
}
