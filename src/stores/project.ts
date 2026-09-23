import { defineStore } from 'pinia'
import { ASPECTS, MAX_SLIDES } from '../constants'
import { downloadBlob, projectSlug, renderToBlob, slideFileName, zipSlides } from '../export/files'
import { fontPair } from '../fonts/catalog'
import { loadFontPair } from '../fonts/loader'
import { blankProject, changeSlideType, cloneSlide, createSampleSlide, createSlide, starterProject } from '../model/factory'
import { normalizeProject, projectAssetIds } from '../model/normalize'
import { SLIDE_TYPES } from '../model/slideTypes'
import { db } from '../persist/db'
import { readProjectFile, writeProjectFile } from '../persist/projectFile'
import { slotFrames } from '../render'
import { clamp, fitImage } from '../render/geometry'
import type { ImageSlot, RenderDoc, Slide, SlideType } from '../types'
import { assetBlob, useAssetStore } from './assets'

const SAVE_KEY = 'project'
const SAVE_DELAY = 400
let saveTimer = 0
let lastSaved = ''

export type SaveState = 'loading' | 'saved' | 'unavailable'

export const useProjectStore = defineStore('project', {
  state: () => ({
    project: starterProject(),
    status: '',
    /** Bumped whenever web fonts finish loading, so canvases redraw with them. */
    fontsVersion: 0,
    saveState: 'loading' as SaveState,
  }),

  getters: {
    doc(state): RenderDoc {
      const { width, height } = ASPECTS[state.project.aspect]
      return { project: state.project, images: useAssetStore().images, width, height }
    },
    canAdd(state): boolean {
      return state.project.slides.length < MAX_SLIDES
    },
    /** Where new slides go: before a trailing call-to-action slide, else at the end. */
    endOfContent(state): number {
      const slides = state.project.slides
      return slides.length && slides[slides.length - 1].type === 'cta' ? slides.length - 1 : slides.length
    },
    /** Required image slots that are still empty. */
    missingCount(state): number {
      return state.project.slides
        .filter((s) => !SLIDE_TYPES[s.type].imagesOptional)
        .reduce((n, s) => n + s.images.slice(0, SLIDE_TYPES[s.type].imageSlots).filter((slot) => !slot.asset).length, 0)
    },
  },

  actions: {
    /** Restore the last session from browser storage, then autosave every change. */
    async init() {
      const assets = useAssetStore()
      try {
        const saved = await db.get<string>(SAVE_KEY)
        if (saved) {
          const project = normalizeProject(JSON.parse(saved))
          await assets.restore(projectAssetIds(project))
          this.project = project
          this.status = 'Restored your last session.'
        }
        lastSaved = JSON.stringify(this.project)
        this.saveState = 'saved'
        assets.collectGarbage(projectAssetIds(this.project))
      } catch {
        this.saveState = 'unavailable'
      }
      this.$subscribe(() => this.scheduleSave(), { detached: true })
    },

    scheduleSave() {
      clearTimeout(saveTimer)
      saveTimer = window.setTimeout(() => this.saveNow(), SAVE_DELAY)
    },

    async saveNow() {
      const json = JSON.stringify(this.project)
      if (json === lastSaved) return
      try {
        await db.set(SAVE_KEY, json)
        lastSaved = json
        this.saveState = 'saved'
      } catch {
        this.saveState = 'unavailable'
      }
    },

    /** Load the theme's fonts (once per pair), then redraw. */
    async ensureFonts() {
      await loadFontPair(fontPair(this.project.theme.fontPair))
      this.fontsVersion++
    },

    /** Replace the slides with a short sample project, keeping size, handle and style. */
    newProject() {
      const { aspect, handle, theme } = this.project
      this.project = { ...blankProject(), aspect, handle, theme }
      this.status = 'Started a new project.'
    },

    async saveProjectFile() {
      const name = `${projectSlug(this.doc)}.carousel.json`
      downloadBlob(await writeProjectFile(this.project, assetBlob), name)
      this.status = `Saved ${name}. Open it here any time to keep editing.`
    },

    async openProjectFile(file: File) {
      try {
        const { project, assets } = await readProjectFile(file)
        const store = useAssetStore()
        await Promise.all(Object.entries(assets).map(([id, blob]) => store.add(blob, id).catch(() => {})))
        const missing = [...projectAssetIds(project)].filter((id) => !store.images[id]).length
        this.project = project
        this.status = `Opened ${file.name}.` + (missing ? ` ${missing} image${missing > 1 ? 's' : ''} couldn't be loaded.` : '')
      } catch (err) {
        this.status = err instanceof Error ? err.message : `${file.name} couldn't be opened.`
      }
    },

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

    /**
     * Fill image slides in filename order, adding image slides for extra files
     * while there's room. The first file also fills an empty cover.
     */
    async loadBulk(files: File[]) {
      const images = files
        .filter((f) => f.type.startsWith('image/'))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      const targets = this.project.slides.filter((s) => s.type === 'image')
      while (targets.length < images.length && this.canAdd) {
        targets.push(this.insertSlide(createSlide('image'), this.endOfContent))
      }
      const used = images.slice(0, targets.length)

      const loads = used.map((file, k) => this.setImage(targets[k].id, 0, file))
      const cover = this.project.slides.find((s) => s.type === 'cover')
      if (cover && !cover.images[0].asset && images[0]) loads.push(this.setImage(cover.id, 0, images[0]))

      const extra = images.length > used.length ? ` Only the first ${used.length} fit (${MAX_SLIDES} slides max).` : ''
      this.status = `Loaded ${used.length} image${used.length === 1 ? '' : 's'}.${extra}`
      await Promise.all(loads)
    },

    /** Insert at `index` (clamped). Returns the inserted slide. */
    insertSlide(slide: Slide, index: number): Slide {
      const at = clamp(index, 0, this.project.slides.length)
      this.project.slides.splice(at, 0, slide)
      return this.project.slides[at]
    },

    addSlide(type: SlideType) {
      if (!this.canAdd) return
      this.insertSlide(createSampleSlide(type), this.endOfContent)
    },

    duplicateSlide(id: string) {
      if (!this.canAdd) return
      const index = this.indexOf(id)
      this.insertSlide(cloneSlide(this.project.slides[index]), index + 1)
    },

    removeSlide(id: string) {
      if (this.project.slides.length <= 1) return
      this.project.slides.splice(this.indexOf(id), 1)
    },

    /** Move a slide so it lands before the slide currently at `toIndex` (length = end). */
    moveSlide(id: string, toIndex: number) {
      const from = this.indexOf(id)
      const [slide] = this.project.slides.splice(from, 1)
      const to = clamp(toIndex > from ? toIndex - 1 : toIndex, 0, this.project.slides.length)
      this.project.slides.splice(to, 0, slide)
    },

    indexOf(id: string): number {
      const index = this.project.slides.findIndex((s) => s.id === id)
      if (index < 0) throw new Error(`No slide ${id}`)
      return index
    },

    updateSlide(id: string, patch: Partial<Pick<Slide, 'title' | 'body'>>) {
      Object.assign(this.slide(id), patch)
    },

    changeType(id: string, type: SlideType) {
      changeSlideType(this.slide(id), type)
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
      await this.ensureFonts()
      const index = this.indexOf(id)
      const slide = this.project.slides[index]
      downloadBlob(await renderToBlob(slide, this.doc), slideFileName(slide, index))
    },

    async downloadAll() {
      const missing = this.missingCount
      const name = `${projectSlug(this.doc)}.zip`
      if (missing) this.status = `${missing} slide${missing > 1 ? 's have' : ' has'} no image yet. Downloading anyway.`
      await this.ensureFonts()
      downloadBlob(await zipSlides(this.doc), name)
      if (!missing) this.status = `Downloaded ${name} with all ${this.project.slides.length} slides.`
    },
  },
})
