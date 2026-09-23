import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { uid } from '../model/factory'
import { db } from '../persist/db'

/** Original file data per asset, kept for saving. Not reactive. */
const blobs = new Map<string, Blob>()

export function assetBlob(id: string): Blob | undefined {
  return blobs.get(id)
}

function decode(blob: Blob): Promise<HTMLImageElement> {
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

/**
 * Decoded images by id. Assets are immutable: replacing a slide's image adds
 * a new asset rather than changing an old one, so undo can point back to it.
 */
export const useAssetStore = defineStore('assets', {
  state: () => ({
    images: {} as Record<string, HTMLImageElement>,
  }),

  actions: {
    /** Decode and register an image. Rejects if the blob isn't a readable image. */
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
