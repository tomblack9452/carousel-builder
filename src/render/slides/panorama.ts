import { panoramaRun } from '../../model/panorama'
import type { Rect, RenderDoc, Slide } from '../../types'
import { type Ctx, drawBackground, drawHandle, shadeBehindText, slotImage } from '../draw'
import { typeStyle } from '../style'
import { type TextLine, bodyLines, drawTextBlock, headingLines, placement } from '../text'

/** One wide frame spanning the whole run, shifted so this slide shows its own section. */
export function panoramaFrames(w: number, h: number, slide: Slide, doc: RenderDoc): Rect[] {
  const slides = doc.project.slides
  const index = slides.indexOf(slide)
  if (index < 0) return [{ x: 0, y: 0, w, h }]
  const { start, count } = panoramaRun(slides, index)
  return [{ x: -(index - start) * w, y: 0, w: w * count, h }]
}

export function drawPanorama(ctx: Ctx, slide: Slide, doc: RenderDoc): Rect | null {
  const { width: W, height: H } = doc
  const ts = typeStyle(doc)
  const [frame] = panoramaFrames(W, H, slide, doc)
  // The drop prompt sits on this slide alone; an image spans the run.
  const hasImage = !!slotImage(doc, slide.images[0])
  drawBackground(ctx, doc, slide, 0, 'Drop a wide image here', hasImage ? frame : undefined)
  if (slide.title.trim() || slide.body.trim()) shadeBehindText(ctx, doc, slide.text.anchor, 0.55, 0.7)

  const lines: TextLine[] = []
  const title = slide.title.trim()
  if (title) lines.push(...headingLines(ctx, ts, title, W - 170, { start: 96, min: 44, maxLines: 2 }))
  const body = slide.body.trim()
  if (body) lines.push(...bodyLines(ctx, ts, body, W - 170, { start: 38, min: 28, maxLines: 2, gapBefore: lines.length ? 6 : 0 }))
  const box = drawTextBlock(ctx, lines, placement(slide, doc), ts)

  drawHandle(ctx, doc, 'right', W - 60, 80, 30, 0.75)
  return box
}
