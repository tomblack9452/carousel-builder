import { renderSlide } from '../render'
import { slotImage } from '../render/draw'
import type { RenderDoc, Slide } from '../types'

/** Instagram's limit for a video in a carousel. */
export const MAX_VIDEO_SECONDS = 60
const FPS = 30

export interface Recording {
  blob: Blob
  ext: 'mp4' | 'webm'
}

/** The best format this browser can record: MP4 if possible (what Instagram prefers), else WebM. */
export function recordingFormat(): { mime: string; ext: Recording['ext'] } | null {
  if (typeof MediaRecorder === 'undefined') return null
  const candidates: [string, Recording['ext']][] = [
    ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'mp4'],
    ['video/mp4', 'mp4'],
    ['video/webm;codecs=vp9,opus', 'webm'],
    ['video/webm', 'webm'],
  ]
  const found = candidates.find(([mime]) => MediaRecorder.isTypeSupported(mime))
  return found ? { mime: found[0], ext: found[1] } : null
}

/** The video a slide plays, if it has one. */
export function slideVideo(slide: Slide, doc: RenderDoc): HTMLVideoElement | null {
  const media = slotImage(doc, slide.images[0])
  return media instanceof HTMLVideoElement ? media : null
}

function once(target: EventTarget, event: string): Promise<void> {
  return new Promise((resolve) => target.addEventListener(event, () => resolve(), { once: true }))
}

/**
 * Record a video slide with its overlays by playing the video from the start
 * and capturing the rendered canvas. Runs in real time (up to 60 seconds).
 */
export async function recordSlide(slide: Slide, doc: RenderDoc): Promise<Recording> {
  const video = slideVideo(slide, doc)
  if (!video) throw new Error('This slide has no video yet.')
  const format = recordingFormat()
  if (!format) throw new Error("This browser can't record video. Try Chrome, Edge or Safari.")

  const canvas = document.createElement('canvas')
  canvas.width = doc.width
  canvas.height = doc.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')

  const stream = canvas.captureStream(FPS)
  // Keep the original soundtrack where the browser lets us capture it.
  try {
    const source = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.()
    source?.getAudioTracks().forEach((track) => stream.addTrack(track))
  } catch {
    // Silent video is still useful.
  }

  const recorder = new MediaRecorder(stream, { mimeType: format.mime, videoBitsPerSecond: 8_000_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }

  const restore = { loop: video.loop, time: video.currentTime, paused: video.paused }
  const duration = Math.min(Number.isFinite(video.duration) ? video.duration : MAX_VIDEO_SECONDS, MAX_VIDEO_SECONDS)
  video.pause()
  video.loop = false
  video.currentTime = 0
  await once(video, 'seeked')

  const stopped = once(recorder, 'stop')
  renderSlide(ctx, slide, doc)
  recorder.start(250)
  await video.play()
  // A timer rather than animation frames, so recording still finishes if the tab
  // is in the background. The deadline stops it even if the video stalls.
  await new Promise<void>((resolve) => {
    const deadline = performance.now() + duration * 1000 + 5000
    const frame = () => {
      renderSlide(ctx, slide, doc)
      if (video.ended || video.currentTime >= duration || performance.now() > deadline) resolve()
      else setTimeout(frame, 1000 / FPS)
    }
    frame()
  })
  recorder.stop()
  await stopped
  stream.getTracks().forEach((t) => t.stop())

  video.pause()
  video.loop = restore.loop
  video.currentTime = restore.time
  if (!restore.paused) video.play().catch(() => {})

  return { blob: new Blob(chunks, { type: format.mime.split(';')[0] }), ext: format.ext }
}
