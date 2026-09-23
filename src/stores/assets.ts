import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { uid } from '../model/factory'

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
    /** Decode and register an image. Rejects if the file isn't a readable image. */
    async add(blob: Blob, id: string = uid()): Promise<string> {
      const img = await decode(blob)
      blobs.set(id, blob)
      // markRaw: images are drawn to canvas, never observed.
      this.images[id] = markRaw(img)
      return id
    },
  },
})
