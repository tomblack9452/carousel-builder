import type { AspectId } from './constants'

export type SlideType =
  | 'cover' | 'image' | 'video' | 'panorama' | 'grid2' | 'grid3' | 'grid4' | 'text' | 'quote' | 'list' | 'compare' | 'cta'

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

/** Per-slide image adjustments. Neutral values leave the image untouched. */
export interface Adjustments {
  /** 1 = unchanged, 0.5 to 1.5. */
  brightness: number
  /** 1 = unchanged, 0 (greyscale) to 2. */
  saturation: number
  /** -1 (cool) to 1 (warm). */
  warmth: number
  /** 0 to 1. */
  vignette: number
}

export type StickerKind = 'emoji' | 'arrow' | 'circle' | 'box' | 'star' | 'underline'

/** A decoration placed on top of a slide. */
export interface Sticker {
  id: string
  kind: StickerKind
  /** The character, for emoji stickers. */
  emoji: string
  /** Centre, as fractions of the slide size. */
  x: number
  y: number
  /** Width as a fraction of the slide width. */
  size: number
  /** Degrees clockwise. */
  rotation: number
  color: string
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
  adjust: Adjustments
  text: TextLayout
  /** Image description for screen readers. */
  alt: string
  stickers: Sticker[]
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

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/** Watermark drawn on every slide. */
export interface Logo {
  asset: string | null
  position: Corner
  /** Width as a fraction of the slide width. */
  size: number
  opacity: number
}

/** Hints drawn on every slide that there's more to swipe through. */
export interface SwipeCues {
  /** "3/10" pill. */
  numbers: boolean
  /** Progress dots along the bottom. */
  dots: boolean
  /** Arrow on the right edge of every slide but the last. */
  arrow: boolean
}

export interface Project {
  aspect: AspectId
  handle: string
  theme: Theme
  logo: Logo
  cues: SwipeCues
  /** Post caption, including hashtags. */
  caption: string
  export: ExportSettings
  slides: Slide[]
}

export interface ExportSettings {
  format: 'jpg' | 'png'
  /** JPEG quality, 0.6 to 1. */
  quality: number
}

/** Saved look that new projects start from. */
export interface BrandKit {
  handle: string
  theme: Theme
  logo: Logo
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** A decoded asset: a still image, or a video (drawn at its current frame). */
export type Media = HTMLImageElement | HTMLVideoElement

/** Everything a renderer may read. */
export interface RenderDoc {
  project: Project
  images: Record<string, Media>
  width: number
  height: number
}
