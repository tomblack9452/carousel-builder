export type SlideType = 'cover' | 'game' | 'end'

export interface Slide {
  id: number
  type: SlideType
  /** Game name (game slides only). */
  name: string
  /** "Console, year" line (game slides only). */
  meta: string
  img: HTMLImageElement | null
  /** Object URL backing `img`, revoked when replaced. */
  url: string | null
  /** 1 = cover-fit, up to 3. */
  zoom: number
  /** Pan position, -1 to 1 on each axis. 0 = centred. */
  px: number
  py: number
}

export interface Settings {
  handle: string
  title: string
  shadow: string
  endTitle: string
  endSub: string
}

/** Everything a renderer may read besides the slide it draws. */
export interface RenderDoc {
  settings: Settings
  slides: Slide[]
}
