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

export type Align = 'left' | 'center' | 'right'
export type Anchor = 'top' | 'middle' | 'bottom'

/** Where a slide's text block sits. x/y are fractions of the slide size. */
export interface TextLayout {
  align: Align
  anchor: Anchor
  /** The block's left edge, centre or right edge, depending on `align`. */
  x: number
  /** The block's top, middle or bottom, depending on `anchor`. */
  y: number
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
  text: TextLayout
}

export interface Theme {
  /** Id from fonts/catalog. */
  fontPair: string
  headingWeight: number
  /** Multipliers on each slide type's default text sizes. */
  headingScale: number
  bodyScale: number
  /** Heading letter spacing in em. */
  letterSpacing: number
  uppercase: boolean
  /** Title shadow and highlight colour. */
  accent: string
  text: string
  /** Behind slides with no image. */
  background: string
  /** Colour of the darkening gradient over images. */
  overlay: string
  /** Multiplier on each slide type's overlay opacity. 0 = none. */
  overlayStrength: number
  titleEffect: TitleEffect
}

export type TitleEffect = 'hard' | 'glow' | 'none'

export interface Project {
  aspect: AspectId
  handle: string
  theme: Theme
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
