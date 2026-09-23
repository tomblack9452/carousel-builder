import type { AspectId } from './constants'

export type SlideType = 'cover' | 'image' | 'text' | 'quote' | 'list' | 'compare' | 'cta'

export interface ImageSlot {
  /** Asset id in the asset store, or null when empty. */
  asset: string | null
  /** 1 = cover-fit, up to 3. */
  zoom: number
  /** Pan position, -1 to 1 on each axis. 0 = centred. */
  px: number
  py: number
}

export interface Slide {
  id: string
  type: SlideType
  /** Main text. What it means depends on the slide type (see model/slideTypes). */
  title: string
  /** Secondary text. */
  body: string
  /** At least as many as the type uses. Extra slots are kept so switching type back restores them. */
  images: ImageSlot[]
}

export interface Project {
  aspect: AspectId
  handle: string
  /** Title shadow colour. */
  accent: string
  slides: Slide[]
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Everything a renderer may read. */
export interface RenderDoc {
  project: Project
  images: Record<string, HTMLImageElement>
  width: number
  height: number
}
