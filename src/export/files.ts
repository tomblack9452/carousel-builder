import JSZip from 'jszip'
import { W, H, JPEG_QUALITY } from '../constants'
import { renderSlide } from '../render'
import type { RenderDoc, Slide } from '../types'

export function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

export function slideFileName(slide: Slide, index: number): string {
  const number = String(index + 1).padStart(2, '0')
  const label = slide.type === 'cover' ? 'cover' : slide.type === 'end' ? 'question' : slug(slide.name) || 'slide'
  return `${number}-${label}.jpg`
}

/** Render a slide at full size on a detached canvas and encode it as JPEG. */
export function renderToBlob(slide: Slide, doc: RenderDoc): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas 2D is not available'))
  renderSlide(ctx, slide, doc)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode slide'))), 'image/jpeg', JPEG_QUALITY)
  })
}

export async function zipSlides(doc: RenderDoc): Promise<Blob> {
  const zip = new JSZip()
  for (const [index, slide] of doc.slides.entries()) {
    zip.file(slideFileName(slide, index), await renderToBlob(slide, doc))
  }
  return zip.generateAsync({ type: 'blob' })
}

export function downloadBlob(blob: Blob, name: string): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 3000)
}
