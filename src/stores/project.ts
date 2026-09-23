import { defineStore } from 'pinia'
import { H, W } from '../constants'
import { downloadBlob, projectSlug, renderToBlob, slideFileName, zipSlides } from '../export/files'
import { starterProject } from '../model/factory'
import { SLIDE_TYPES } from '../model/slideTypes'
import { slotFrames } from '../render'
import { clamp, fitImage } from '../render/geometry'
import type { ImageSlot, RenderDoc, Slide } from '../types'
import { useAssetStore } from './assets'

export const useProjectStore = defineStore('project', {
  state: () => ({
    project: starterProject(),
    status: '',
    /** Flips once web fonts load so canvases redraw with them. */
    fontsReady: false,
  }),

  getters: {
    doc(state): RenderDoc {
      return { project: state.project, images: useAssetStore().images, width: W, height: H }
    },
    imageSlideCount(state): number {
      return state.project.slides.filter((s) => s.type === 'image').length
    },
    /** Required image slots that are still empty. */
    missingCount(state): number {
      return state.project.slides
        .filter((s) => !SLIDE_TYPES[s.type].imagesOptional)
        .reduce((n, s) => n + s.images.filter((slot) => !slot.asset).length, 0)
    },
  },

  actions: {
    slide(id: string): Slide {
      const slide = this.project.slides.find((s) => s.id === id)
      if (!slide) throw new Error(`No slide ${id}`)
      return slide
    },

    async setImage(slideId: string, slotIndex: number, file: File) {
      try {
        const asset = await useAssetStore().add(file)
        Object.assign(this.slide(slideId).images[slotIndex], { asset, zoom: 1, px: 0, py: 0 })
      } catch {
        this.status = `${file.name} couldn't be read as an image. Save it as JPG or PNG and try again.`
      }
    },

    /** Fill image slides in filename order. The first file also fills an empty cover. */
    async loadBulk(files: File[]) {
      const images = files
        .filter((f) => f.type.startsWith('image/'))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      const targets = this.project.slides.filter((s) => s.type === 'image')
      const used = images.slice(0, targets.length)

      const loads = used.map((file, k) => this.setImage(targets[k].id, 0, file))
      const cover = this.project.slides.find((s) => s.type === 'cover')
      if (cover && !cover.images[0].asset && images[0]) loads.push(this.setImage(cover.id, 0, images[0]))

      const extra = images.length > used.length ? ` Only the first ${used.length} were used.` : ''
      this.status = `Loaded ${used.length} screenshots.${extra}`
      await Promise.all(loads)
    },

    updateSlide(id: string, patch: Partial<Pick<Slide, 'title' | 'body'>>) {
      Object.assign(this.slide(id), patch)
    },

    updateSlot(id: string, slotIndex: number, patch: Partial<ImageSlot>) {
      Object.assign(this.slide(id).images[slotIndex], patch)
    },

    /** Pan by a distance in slide pixels (e.g. from a pointer drag). */
    panBy(id: string, slotIndex: number, dx: number, dy: number) {
      const slide = this.slide(id)
      const slot = slide.images[slotIndex]
      const img = slot.asset ? useAssetStore().images[slot.asset] : undefined
      if (!img) return
      const frame = slotFrames(slide, this.doc.width, this.doc.height)[slotIndex]
      const { marginX, marginY } = fitImage(img, slot.zoom, frame.w, frame.h)
      if (marginX > 0) slot.px = clamp(slot.px + dx / marginX, -1, 1)
      if (marginY > 0) slot.py = clamp(slot.py + dy / marginY, -1, 1)
    },

    /** Pan by a fraction of the pan range (e.g. from arrow keys). */
    nudge(id: string, slotIndex: number, dx: number, dy: number) {
      const slot = this.slide(id).images[slotIndex]
      slot.px = clamp(slot.px + dx, -1, 1)
      slot.py = clamp(slot.py + dy, -1, 1)
    },

    async downloadSlide(id: string) {
      const index = this.project.slides.findIndex((s) => s.id === id)
      const slide = this.project.slides[index]
      downloadBlob(await renderToBlob(slide, this.doc), slideFileName(slide, index))
    },

    async downloadAll() {
      const missing = this.missingCount
      const name = `${projectSlug(this.doc)}.zip`
      if (missing) this.status = `${missing} slide${missing > 1 ? 's have' : ' has'} no image yet. Downloading anyway.`
      downloadBlob(await zipSlides(this.doc), name)
      if (!missing) this.status = `Downloaded ${name} with all ${this.project.slides.length} slides.`
    },
  },
})
