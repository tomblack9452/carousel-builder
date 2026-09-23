import { W, H } from '../constants'

export interface ImageFit {
  scale: number
  width: number
  height: number
  /** How far the image overflows each side of the slide. */
  marginX: number
  marginY: number
}

/** Cover-fit an image to the slide, then apply zoom. */
export function fitImage(img: HTMLImageElement, zoom: number): ImageFit {
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight) * zoom
  const width = img.naturalWidth * scale
  const height = img.naturalHeight * scale
  return { scale, width, height, marginX: (width - W) / 2, marginY: (height - H) / 2 }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
