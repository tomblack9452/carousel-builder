import { W, H, TITLE_FONT } from '../../constants'
import type { RenderDoc, Slide } from '../../types'
import { type Ctx, drawHandle, drawSlideImage, fitSize, font, hardText, placeholder, shade } from '../draw'

export function drawCover(ctx: Ctx, slide: Slide, { settings }: RenderDoc): void {
  if (slide.img) drawSlideImage(ctx, slide)
  else placeholder(ctx, 'Drop the cover image here')
  shade(ctx, 0.35, 0.7)

  const lines = settings.title
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.toUpperCase())

  if (lines.length) {
    let size = fitSize(ctx, lines, '', TITLE_FONT, W - 170, 210, 60)
    while (size > 60 && lines.length * size * 1.02 > H * 0.62) size -= 2
    ctx.font = font('', size, TITLE_FONT)
    const lineHeight = size * 1.02
    const offset = Math.round(size * 0.06)
    let y = H - 110 - (lines.length - 1) * lineHeight
    for (const line of lines) {
      hardText(ctx, line, 80, y, offset, settings.shadow)
      y += lineHeight
    }
  }

  drawHandle(ctx, settings.handle, 'center', W / 2, 90, 36, 0.9)
}
