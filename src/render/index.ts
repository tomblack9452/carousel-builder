import type { Rect, RenderDoc, Slide, SlideType } from '../types'
import type { Ctx } from './draw'
import { compareFrames, drawCompare } from './slides/compare'
import { drawCover } from './slides/cover'
import { drawCta } from './slides/cta'
import { drawImage } from './slides/image'
import { drawList } from './slides/list'
import { drawQuote } from './slides/quote'
import { drawText } from './slides/text'

export interface SlideRenderer {
  /** Returns the bounds of the movable text block, if any was drawn. */
  draw: (ctx: Ctx, slide: Slide, doc: RenderDoc) => Rect | null
  /** Where each image slot sits on the slide. Defaults to one full-bleed frame. */
  frames?: (w: number, h: number) => Rect[]
}

/** One renderer per slide type. Add a new slide type by adding an entry here. */
const renderers: Record<SlideType, SlideRenderer> = {
  cover: { draw: drawCover },
  image: { draw: drawImage },
  text: { draw: drawText },
  quote: { draw: drawQuote },
  list: { draw: drawList },
  compare: { draw: drawCompare, frames: compareFrames },
  cta: { draw: drawCta },
}

export function slotFrames(slide: Slide, w: number, h: number): Rect[] {
  return renderers[slide.type].frames?.(w, h) ?? [{ x: 0, y: 0, w, h }]
}

/** Draw a slide. Returns the text block's bounds so the editor can let you drag it. */
export function renderSlide(ctx: Ctx, slide: Slide, doc: RenderDoc): Rect | null {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.filter = 'none'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.clearRect(0, 0, doc.width, doc.height)
  return renderers[slide.type].draw(ctx, slide, doc)
}
