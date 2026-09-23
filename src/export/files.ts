import JSZip from 'jszip'
import { renderSlide } from '../render'
import type { ExportSettings, RenderDoc, Slide } from '../types'
import { buildPdf } from './pdf'
import { type Recording, recordSlide, slideVideo } from './video'

export function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

export function slideFileName(slide: Slide, index: number, format: ExportSettings['format'] | Recording['ext'] = 'jpg'): string {
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

/** Every slide, with video slides recorded to video files. `onProgress` hears about slow steps. */
export async function zipSlides(doc: RenderDoc, onProgress: (message: string) => void = () => {}): Promise<Blob> {
  const zip = new JSZip()
  const names: string[] = []
  for (const [index, slide] of doc.project.slides.entries()) {
    if (slideVideo(slide, doc)) {
      onProgress(`Recording the video on slide ${index + 1}…`)
      const { blob, ext } = await recordSlide(slide, doc)
      names.push(slideFileName(slide, index, ext))
      zip.file(names[index], blob)
    } else {
      names.push(slideFileName(slide, index, doc.project.export.format))
      zip.file(names[index], await renderToBlob(slide, doc))
    }
  }
  const caption = doc.project.caption.trim()
  if (caption) zip.file('caption.txt', caption)
  const alt = altTextList(doc, names)
  if (alt) zip.file('alt-text.txt', alt)
  return zip.generateAsync({ type: 'blob' })
}

/** A slide as a small base64 JPEG (no data: prefix), e.g. to send for alt text. */
export function slideThumbnailBase64(slide: Slide, doc: RenderDoc, width = 768): string {
  const full = document.createElement('canvas')
  full.width = doc.width
  full.height = doc.height
  const ctx = full.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  renderSlide(ctx, slide, doc)
  const small = document.createElement('canvas')
  small.width = width
  small.height = Math.round((doc.height / doc.width) * width)
  small.getContext('2d')?.drawImage(full, 0, 0, small.width, small.height)
  return small.toDataURL('image/jpeg', 0.85).split(',')[1]
}

/**
 * "01-cover.jpg: description" per slide that has alt text, for pasting into Instagram.
 * `names` are the exported file names, so video slides show their real extension.
 */
export function altTextList(doc: RenderDoc, names: string[]): string {
  return doc.project.slides
    .map((slide, i) => (slide.alt.trim() ? `${names[i]}: ${slide.alt.trim()}` : ''))
    .filter(Boolean)
    .join('\n')
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
