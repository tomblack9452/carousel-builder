import JSZip from 'jszip'
import { renderSlide } from '../render'
import type { ExportSettings, RenderDoc, Slide } from '../types'
import { buildPdf } from './pdf'

export function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

export function slideFileName(slide: Slide, index: number, format: ExportSettings['format'] = 'jpg'): string {
  const number = String(index + 1).padStart(2, '0')
  const label = slide.type === 'image' ? slug(slide.title) || 'slide' : slide.type
  return `${number}-${label}.${format}`
}

/** Named after the cover title, e.g. "swipe-through-for-the-full-story". */
export function projectSlug(doc: RenderDoc): string {
  const cover = doc.project.slides.find((s) => s.type === 'cover')
  return slug(cover?.title ?? '') || 'carousel'
}

/** Render a slide at full size on a detached canvas and encode it in the export format. */
export function renderToBlob(slide: Slide, doc: RenderDoc, settings: ExportSettings = doc.project.export): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = doc.width
  canvas.height = doc.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas 2D is not available'))
  renderSlide(ctx, slide, doc)
  return new Promise((resolve, reject) => {
    const type = settings.format === 'png' ? 'image/png' : 'image/jpeg'
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode slide'))), type, settings.quality)
  })
}

export async function zipSlides(doc: RenderDoc): Promise<Blob> {
  const zip = new JSZip()
  for (const [index, slide] of doc.project.slides.entries()) {
    zip.file(slideFileName(slide, index, doc.project.export.format), await renderToBlob(slide, doc))
  }
  const caption = doc.project.caption.trim()
  if (caption) zip.file('caption.txt', caption)
  return zip.generateAsync({ type: 'blob' })
}

/** Every slide as a page of one PDF (always JPEG inside, at the chosen quality). */
export async function pdfSlides(doc: RenderDoc): Promise<Blob> {
  const settings: ExportSettings = { format: 'jpg', quality: doc.project.export.quality }
  const pages = []
  for (const slide of doc.project.slides) {
    const jpeg = new Uint8Array(await (await renderToBlob(slide, doc, settings)).arrayBuffer())
    pages.push({ jpeg, width: doc.width, height: doc.height })
  }
  return buildPdf(pages)
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
