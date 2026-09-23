import type { Rect, RenderDoc, Slide } from '../../types'
import { type Ctx, drawBackground, drawHandle, shadeBehindText } from '../draw'
import { typeStyle } from '../style'
import { type TextLine, bodyLines, drawTextBlock, headingLines, placement } from '../text'

export function drawImage(ctx: Ctx, slide: Slide, doc: RenderDoc): Rect | null {
  return drawCaptioned(ctx, slide, doc, 'Drop an image here')
}

/** Video slides look like image slides; the frame drawn is the video's current one. */
export function drawVideo(ctx: Ctx, slide: Slide, doc: RenderDoc): Rect | null {
  return drawCaptioned(ctx, slide, doc, 'Drop a video here')
}

function drawCaptioned(ctx: Ctx, slide: Slide, doc: RenderDoc, prompt: string): Rect | null {
  const { width: W } = doc
  const ts = typeStyle(doc)
  drawBackground(ctx, doc, slide, 0, prompt)
  shadeBehindText(ctx, doc, slide.text.anchor, 0.55, 0.75)

  const lines: TextLine[] = []
  const title = slide.title.trim()
  if (title) lines.push(...headingLines(ctx, ts, title, W - 170, { start: 96, min: 44, maxLines: 2 }))
  const body = slide.body.trim()
  if (body) {
    lines.push(...bodyLines(ctx, ts, body, W - 170, {
      start: 38, min: 28, maxLines: 2, gapBefore: lines.length ? 6 : 0, alpha: 0.88,
    }))
  }
  const box = drawTextBlock(ctx, lines, placement(slide, doc), ts)

  drawHandle(ctx, doc, 'right', W - 60, 80, 30, 0.75)
  return box
}
