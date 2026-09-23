import { W, H, SUB_FONT, TITLE_FONT } from '../../constants'
import type { RenderDoc, Slide } from '../../types'
import { type Ctx, drawHandle, drawSlideImage, fitSize, font, hardText, placeholder, shade } from '../draw'

export function drawGame(ctx: Ctx, slide: Slide, { settings }: RenderDoc): void {
  if (slide.img) drawSlideImage(ctx, slide)
  else placeholder(ctx, 'Drop a screenshot here')
  shade(ctx, 0.55, 0.75)

  const name = slide.name.trim()
  const meta = slide.meta.trim()

  if (name) {
    const size = fitSize(ctx, [name], '', TITLE_FONT, W - 170, 96, 44)
    ctx.font = font('', size, TITLE_FONT)
    hardText(ctx, name, 80, meta ? H - 150 : H - 100, Math.max(3, Math.round(size * 0.06)), settings.shadow)
  }
  if (meta) {
    ctx.font = font(600, 38, SUB_FONT)
    ctx.fillStyle = 'rgba(255,255,255,.88)'
    ctx.fillText(meta, 82, H - 92)
  }

  drawHandle(ctx, settings.handle, 'right', W - 60, 80, 30, 0.75)
}
