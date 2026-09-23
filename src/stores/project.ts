import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { GAME_SLIDE_COUNT, ZIP_NAME } from '../constants'
import { downloadBlob, renderToBlob, slideFileName, zipSlides } from '../export/files'
import { clamp, fitImage } from '../render/geometry'
import type { RenderDoc, Settings, Slide, SlideType } from '../types'

let nextId = 1

function createSlide(type: SlideType): Slide {
  return { id: nextId++, type, name: '', meta: '', img: null, url: null, zoom: 1, px: 0, py: 0 }
}

function defaultSlides(): Slide[] {
  return [
    createSlide('cover'),
    ...Array.from({ length: GAME_SLIDE_COUNT }, () => createSlide('game')),
    createSlide('end'),
  ]
}

function defaultSettings(): Settings {
  return {
    handle: '@yourhandle',
    title: 'The beauty\nof sunset\nin games',
    shadow: '#ff7a3d',
    endTitle: "Which one's yours?",
    endSub: 'Drop your favourite game sunset in the comments',
  }
}

function readImage(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not decode ${file.name}`))
    }
    img.src = url
  })
}

export const useProjectStore = defineStore('project', {
  state: () => ({
    settings: defaultSettings(),
    slides: defaultSlides(),
    status: '',
    /** Flips once web fonts load so canvases redraw with them. */
    fontsReady: false,
  }),

  getters: {
    doc(state): RenderDoc {
      return { settings: state.settings, slides: state.slides }
    },
    gameCount(state): number {
      return state.slides.filter((s) => s.type === 'game').length
    },
    /** Slides that take an image but don't have one yet. */
    missingCount(state): number {
      return state.slides.filter((s) => s.type !== 'end' && !s.img).length
    },
  },

  actions: {
    async loadImage(index: number, file: File) {
      try {
        const { img, url } = await readImage(file)
        const slide = this.slides[index]
        if (slide.url) URL.revokeObjectURL(slide.url)
        // markRaw: the image is drawn to canvas, never observed.
        Object.assign(slide, { img: markRaw(img), url, zoom: 1, px: 0, py: 0 })
      } catch {
        this.status = `${file.name} couldn't be read as an image. Save it as JPG or PNG and try again.`
      }
    },

    /** Fill game slides in filename order. The first file also fills an empty cover. */
    async loadBulk(files: File[]) {
      const images = files
        .filter((f) => f.type.startsWith('image/'))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      const gameIndexes = this.slides.flatMap((s, i) => (s.type === 'game' ? [i] : []))
      const used = images.slice(0, gameIndexes.length)

      const loads = used.map((file, k) => this.loadImage(gameIndexes[k], file))
      const coverIndex = this.slides.findIndex((s) => s.type === 'cover')
      if (coverIndex >= 0 && !this.slides[coverIndex].img && images[0]) {
        loads.push(this.loadImage(coverIndex, images[0]))
      }

      const extra = images.length > used.length ? ` Only the first ${used.length} were used.` : ''
      this.status = `Loaded ${used.length} screenshots.${extra}`
      await Promise.all(loads)
    },

    updateSlide(index: number, patch: Partial<Pick<Slide, 'name' | 'meta' | 'zoom'>>) {
      Object.assign(this.slides[index], patch)
    },

    /** Pan by a distance in slide pixels (e.g. from a pointer drag). */
    panBy(index: number, dx: number, dy: number) {
      const slide = this.slides[index]
      if (!slide.img) return
      const { marginX, marginY } = fitImage(slide.img, slide.zoom)
      if (marginX > 0) slide.px = clamp(slide.px + dx / marginX, -1, 1)
      if (marginY > 0) slide.py = clamp(slide.py + dy / marginY, -1, 1)
    },

    /** Pan by a fraction of the pan range (e.g. from arrow keys). */
    nudge(index: number, dx: number, dy: number) {
      const slide = this.slides[index]
      slide.px = clamp(slide.px + dx, -1, 1)
      slide.py = clamp(slide.py + dy, -1, 1)
    },

    async downloadSlide(index: number) {
      const slide = this.slides[index]
      downloadBlob(await renderToBlob(slide, this.doc), slideFileName(slide, index))
    },

    async downloadAll() {
      const missing = this.missingCount
      if (missing) this.status = `${missing} slide${missing > 1 ? 's have' : ' has'} no image yet. Downloading anyway.`
      downloadBlob(await zipSlides(this.doc), ZIP_NAME)
      if (!missing) this.status = `Downloaded ${ZIP_NAME} with all ${this.slides.length} slides.`
    },
  },
})
