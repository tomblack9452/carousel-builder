import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { uid } from '../model/factory'
import { db } from '../persist/db'
import type { Media } from '../types'

/** Original file data per asset, kept for saving. Not reactive. */
const blobs = new Map<string, Blob>()

export function assetBlob(id: string): Blob | undefined {
  return blobs.get(id)
}

export function isVideo(blob: Blob): boolean {
  return blob.type.startsWith('video/')
}

function decodeImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not decode image'))
    }
    img.src = url
  })
}

/** A muted, looping video element with its first frame ready to draw. */
function decodeVideo(blob: Blob): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const video = document.createElement('video')
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = 'auto'
    video.onloadeddata = () => resolve(video)
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not decode video'))
    }
    video.src = url
  })
}

function decode(blob: Blob): Promise<Media> {
  return isVideo(blob) ? decodeVideo(blob) : decodeImage(blob)
}

/**
 * Decoded images and videos by id. Assets are immutable: replacing a slide's
 * image adds a new asset rather than changing an old one, so undo can point back to it.
 */
export const useAssetStore = defineStore('assets', {
  state: () => ({
    images: {} as Record<string, Media>,
  }),

  actions: {
    /** Decode and register an image or video. Rejects if the blob can't be read. */
    async add(blob: Blob, id: string = uid(), persist = true): Promise<string> {
      const img = await decode(blob)
      blobs.set(id, blob)
      // markRaw: images are drawn to canvas, never observed.
      this.images[id] = markRaw(img)
      if (persist) db.putAsset(id, blob).catch(() => {})
      return id
    },

    /** Load saved images from browser storage. Missing or broken ones are skipped. */
    async restore(ids: Iterable<string>) {
      await Promise.all([...ids].map(async (id) => {
        if (this.images[id]) return
        const blob = await db.getAsset(id).catch(() => undefined)
        if (blob) await this.add(blob, id, false).catch(() => {})
      }))
    },

    /** Delete stored images nothing refers to any more. Anything loaded this session is kept. */
    async collectGarbage(keep: Set<string>) {
      const stored = await db.assetIds().catch(() => [] as string[])
      const unused = stored.filter((id) => !keep.has(id) && !this.images[id])
      await Promise.all(unused.map((id) => db.deleteAsset(id).catch(() => {})))
    },
  },
})
