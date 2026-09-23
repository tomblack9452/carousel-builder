import { stickerAspect } from '../model/stickers'
import type { Rect, RenderDoc, Slide, Sticker } from '../types'
import type { Ctx } from './draw'

/** Unrotated bounds of a sticker in slide pixels. */
export function stickerBox(sticker: Sticker, doc: RenderDoc): Rect {
  const w = sticker.size * doc.width
  const h = w * stickerAspect(sticker.kind)
  return { x: sticker.x * doc.width - w / 2, y: sticker.y * doc.height - h / 2, w, h }
}

function drawShape(ctx: Ctx, s: Sticker, w: number, h: number): void {
  const line = Math.max(6, w * 0.045)
  ctx.strokeStyle = s.color
  ctx.fillStyle = s.color
  ctx.lineWidth = line
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  switch (s.kind) {
    case 'emoji':
      ctx.font = `${Math.round(w * 0.9)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(s.emoji, 0, h * 0.04)
      break
    case 'arrow': {
      const head = h * 0.5
      ctx.beginPath()
      ctx.moveTo(-w / 2 + line, 0)
      ctx.lineTo(w / 2 - line, 0)
      ctx.moveTo(w / 2 - line - head, -head)
      ctx.lineTo(w / 2 - line, 0)
      ctx.lineTo(w / 2 - line - head, head)
      ctx.stroke()
      break
    }
    case 'circle':
      ctx.beginPath()
      ctx.ellipse(0, 0, w / 2 - line, h / 2 - line, 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    case 'box':
      ctx.beginPath()
      ctx.roundRect(-w / 2 + line, -h / 2 + line, w - line * 2, h - line * 2, w * 0.06)
      ctx.stroke()
      break
    case 'star': {
      const outer = w / 2
      const inner = outer * 0.45
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? inner : outer
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'underline':
      // A slightly wavy marker stroke.
      ctx.lineWidth = line * 1.6
      ctx.beginPath()
      ctx.moveTo(-w / 2 + line, h * 0.1)
      ctx.bezierCurveTo(-w / 6, -h * 0.35, w / 6, h * 0.45, w / 2 - line, -h * 0.1)
      ctx.stroke()
      break
  }
}

export function drawStickers(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  for (const s of slide.stickers) {
    const box = stickerBox(s, doc)
    ctx.save()
    ctx.translate(box.x + box.w / 2, box.y + box.h / 2)
    ctx.rotate((s.rotation * Math.PI) / 180)
    ctx.shadowColor = 'rgba(0,0,0,.35)'
    ctx.shadowBlur = 10
    drawShape(ctx, s, box.w, box.h)
    ctx.restore()
  }
}
