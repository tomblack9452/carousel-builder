import { W, H } from '../constants'
import type { RenderDoc, Slide, SlideType } from '../types'
import type { Ctx } from './draw'
import { drawCover } from './slides/cover'
import { drawEnd } from './slides/end'
import { drawGame } from './slides/game'

export type SlideRenderer = (ctx: Ctx, slide: Slide, doc: RenderDoc) => void

/** One renderer per slide type. Add a new slide type by adding an entry here. */
const renderers: Record<SlideType, SlideRenderer> = {
  cover: drawCover,
  game: drawGame,
  end: drawEnd,
}

export function renderSlide(ctx: Ctx, slide: Slide, doc: RenderDoc): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.filter = 'none'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.clearRect(0, 0, W, H)
  renderers[slide.type](ctx, slide, doc)
}
