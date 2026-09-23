import type { Align, Anchor, Rect, SlideType, TextLayout } from '../types'

/** Side margin as a fraction of slide width (80px on a 1080px slide). */
export const EDGE_X = 80 / 1080

/** Where each snap position puts the block, as a fraction of slide height. */
const SNAP_Y: Record<Anchor, number> = { top: 0.1, middle: 0.5, bottom: 0.93 }

export function alignX(align: Align): number {
  return align === 'left' ? EDGE_X : align === 'center' ? 0.5 : 1 - EDGE_X
}

export function snapY(anchor: Anchor): number {
  return SNAP_Y[anchor]
}

const layout = (align: Align, anchor: Anchor, y = snapY(anchor)): TextLayout => ({ align, anchor, x: alignX(align), y })

/** Where each slide type puts its text until it's moved. */
export const DEFAULT_TEXT: Record<SlideType, TextLayout> = {
  cover: layout('left', 'bottom'),
  image: layout('left', 'bottom', 0.95),
  video: layout('left', 'bottom', 0.95),
  panorama: layout('left', 'bottom', 0.95),
  grid2: layout('center', 'bottom'),
  grid3: layout('center', 'bottom'),
  grid4: layout('center', 'middle'),
  text: layout('left', 'middle'),
  quote: layout('center', 'middle'),
  list: layout('left', 'middle'),
  compare: layout('center', 'middle'),
  cta: layout('center', 'middle', 0.47),
}

/** The layout that reproduces a drawn block's position, keeping its align and anchor. */
export function layoutFromBox(current: TextLayout, box: Rect, w: number, h: number): TextLayout {
  const x = current.align === 'left' ? box.x : current.align === 'center' ? box.x + box.w / 2 : box.x + box.w
  const y = current.anchor === 'top' ? box.y : current.anchor === 'middle' ? box.y + box.h / 2 : box.y + box.h
  const round = (v: number) => Math.round(v * 10000) / 10000
  return { ...current, x: round(x / w), y: round(y / h) }
}
