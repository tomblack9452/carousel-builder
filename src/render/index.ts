import type { Rect, RenderDoc, Slide, SlideType } from '../types'
import { drawCues } from './cues'
import type { Ctx } from './draw'
import { drawStickers } from './stickers'
import { compareFrames, drawCompare } from './slides/compare'
import { drawCover } from './slides/cover'
import { drawCta } from './slides/cta'
import { drawGrid, grid2Frames, grid3Frames, grid4Frames } from './slides/grid'
import { drawImage } from './slides/image'
import { drawList } from './slides/list'
import { drawPanorama, panoramaFrames } from './slides/panorama'
import { drawQuote } from './slides/quote'
import { drawText } from './slides/text'

export interface SlideRenderer {
  /** Returns the bounds of the movable text block, if any was drawn. */
  draw: (ctx: Ctx, slide: Slide, doc: RenderDoc) => Rect | null
  /** Where each image slot sits on the slide. Defaults to one full-bleed frame. */
  frames?: (w: number, h: number, slide: Slide, doc: RenderDoc) => Rect[]
}

/** One renderer per slide type. Add a new slide type by adding an entry here. */
const renderers: Record<SlideType, SlideRenderer> = {
  cover: { draw: drawCover },
  image: { draw: drawImage },
  panorama: { draw: drawPanorama, frames: panoramaFrames },
  grid2: { draw: drawGrid, frames: grid2Frames },
  grid3: { draw: drawGrid, frames: grid3Frames },
  grid4: { draw: drawGrid, frames: grid4Frames },
  text: { draw: drawText },
  quote: { draw: drawQuote },
  list: { draw: drawList },
  compare: { draw: drawCompare, frames: compareFrames },
  cta: { draw: drawCta },
}

export function slotFrames(slide: Slide, doc: RenderDoc): Rect[] {
  const { width: w, height: h } = doc
  return renderers[slide.type].frames?.(w, h, slide, doc) ?? [{ x: 0, y: 0, w, h }]
}

/** Draw a slide. Returns the text block's bounds so the editor can let you drag it. */
export function renderSlide(ctx: Ctx, slide: Slide, doc: RenderDoc): Rect | null {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.filter = 'none'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.clearRect(0, 0, doc.width, doc.height)
  const box = renderers[slide.type].draw(ctx, slide, doc)
  drawStickers(ctx, slide, doc)
  drawLogo(ctx, doc)
  drawCues(ctx, slide, doc)
  return box
}

const LOGO_MARGIN = 50

/** The project watermark, in its corner, keeping the logo's proportions. */
function drawLogo(ctx: Ctx, doc: RenderDoc): void {
  const { asset, position, size, opacity } = doc.project.logo
  const img = asset ? doc.images[asset] : undefined
  if (!img) return
  const w = doc.width * size
  const h = w * (img.naturalHeight / img.naturalWidth)
  const x = position.endsWith('left') ? LOGO_MARGIN : doc.width - LOGO_MARGIN - w
  const y = position.startsWith('top') ? LOGO_MARGIN : doc.height - LOGO_MARGIN - h
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.drawImage(img, x, y, w, h)
  ctx.restore()
}
