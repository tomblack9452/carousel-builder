import type { Rect } from '../types'

export interface ImageFit {
  scale: number
  width: number
  height: number
  /** How far the image overflows each side of its frame. */
  marginX: number
  marginY: number
}

/** Cover-fit an image to a frame, then apply zoom. */
export function fitImage(img: HTMLImageElement, zoom: number, frameW: number, frameH: number): ImageFit {
  const scale = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight) * zoom
  const width = img.naturalWidth * scale
  const height = img.naturalHeight * scale
  return { scale, width, height, marginX: (width - frameW) / 2, marginY: (height - frameH) / 2 }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function contains(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
}
