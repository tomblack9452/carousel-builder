import type { RenderDoc, Slide } from '../types'
import { type Ctx, rgba } from './draw'
import { typeStyle } from './style'
import { setFont } from './text'

const EDGE = 44

/** Slide numbers, progress dots and a next arrow, as the project's cue settings ask. */
export function drawCues(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  const { cues, slides, theme } = doc.project
  const index = slides.indexOf(slide)
  if (index < 0) return
  const total = slides.length
  const { width: W, height: H } = doc

  if (cues.dots && total > 1) {
    const gap = 24
    const r = 7
    const startX = W / 2 - ((total - 1) * gap) / 2
    for (let i = 0; i < total; i++) {
      ctx.beginPath()
      ctx.arc(startX + i * gap, H - 30, r, 0, Math.PI * 2)
      ctx.fillStyle = rgba(theme.text, i === index ? 0.95 : 0.35)
      ctx.fill()
    }
  }

  if (cues.numbers) {
    const text = `${index + 1}/${total}`
    ctx.save()
    setFont(ctx, typeStyle(doc).bodyBold, 30)
    const w = ctx.measureText(text).width + 32
    const h = 48
    const x = W - EDGE - w
    const y = H - EDGE - h
    ctx.fillStyle = rgba(theme.overlay, 0.55)
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, h / 2)
    ctx.fill()
    ctx.fillStyle = theme.text
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x + 16, y + h / 2 + 1)
    ctx.restore()
  }

  if (cues.arrow && index < total - 1) {
    const cx = W - 62
    const cy = H / 2
    ctx.save()
    ctx.fillStyle = rgba(theme.overlay, 0.45)
    ctx.beginPath()
    ctx.arc(cx, cy, 34, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = theme.text
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - 6, cy - 13)
    ctx.lineTo(cx + 8, cy)
    ctx.lineTo(cx - 6, cy + 13)
    ctx.stroke()
    ctx.restore()
  }
}
