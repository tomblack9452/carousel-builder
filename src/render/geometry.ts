import type { Media, Rect } from '../types'

export interface ImageFit {
  scale: number
  width: number
  height: number
  /** How far the image overflows each side of its frame. */
  marginX: number
  marginY: number
}

/** Pixel size of an image or video. */
export function mediaSize(media: Media): { width: number; height: number } {
  return media instanceof HTMLVideoElement
    ? { width: media.videoWidth || 1, height: media.videoHeight || 1 }
    : { width: media.naturalWidth || 1, height: media.naturalHeight || 1 }
}

/** Cover-fit an image to a frame, then apply zoom. */
export function fitImage(media: Media, zoom: number, frameW: number, frameH: number): ImageFit {
  const { width: w, height: h } = mediaSize(media)
  const scale = Math.max(frameW / w, frameH / h) * zoom
  const width = w * scale
  const height = h * scale
  return { scale, width, height, marginX: (width - frameW) / 2, marginY: (height - frameH) / 2 }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function contains(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
}
