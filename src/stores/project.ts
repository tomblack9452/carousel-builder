import { defineStore } from 'pinia'
import { ASPECTS, MAX_SLIDES } from '../constants'
import { downloadBlob, pdfSlides, projectSlug, renderToBlob, slideFileName, zipSlides } from '../export/files'
import { fontPair } from '../fonts/catalog'
import { loadFontPair } from '../fonts/loader'
import {
  blankProject, changeSlideType, cloneSlide, createSampleSlide, createSlide, neutralAdjustments, starterProject,
} from '../model/factory'
import type { TextRow } from '../model/csv'
import { normalizeProject, projectAssetIds } from '../model/normalize'
import { panoramaRun, syncPanoramas } from '../model/panorama'
import { SLIDE_TYPES } from '../model/slideTypes'
import { db } from '../persist/db'
import { readProjectFile, writeProjectFile } from '../persist/projectFile'
import { slotFrames } from '../render'
import { clamp, fitImage } from '../render/geometry'
import { paletteFromImage } from '../render/palette'
import { alignX, layoutFromBox, snapY } from '../model/textLayout'
import type { Adjustments, Align, Anchor, BrandKit, ImageSlot, Rect, RenderDoc, Slide, SlideType } from '../types'
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
    /**
     * Restore the last session from browser storage, then autosave every change.
     * `keep` lists stored images used outside the project (e.g. the brand kit logo).
     */
    async init(keep: string[] = []) {
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
        assets.collectGarbage(new Set([...projectAssetIds(this.project), ...keep]))
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

    /**
     * Replace the slides with a short sample project. Handle, style and logo
     * come from the brand kit if there is one, else from the current project.
     */
    newProject(kit: BrandKit | null = null) {
      const { handle, theme, logo } = kit ?? this.project
      const look = JSON.parse(JSON.stringify({ handle, theme, logo })) as BrandKit
      this.project = { ...blankProject(), aspect: this.project.aspect, ...look }
      this.status = kit ? 'Started a new project from your brand kit.' : 'Started a new project.'
    },

    /** Set accent, background and overlay from the cover image (or the first image in the project). */
    matchColoursToCover() {
      const images = useAssetStore().images
      const slides = this.project.slides
      const withImage = (s: Slide) => s.images.some((slot) => slot.asset && images[slot.asset])
      const source = slides.find((s) => s.type === 'cover' && withImage(s)) ?? slides.find(withImage)
      const asset = source?.images.find((slot) => slot.asset && images[slot.asset])?.asset
      if (!asset) {
        this.status = 'Add a cover image first, then match colours to it.'
        return
      }
      const palette = paletteFromImage(images[asset])
      if (!palette) {
        this.status = "That image doesn't have a strong colour to match."
        return
      }
      Object.assign(this.project.theme, palette)
      this.status = 'Matched colours to your image.'
    },

    async setLogo(file: File) {
      try {
        this.project.logo.asset = await useAssetStore().add(file)
      } catch {
        this.status = `${file.name} couldn't be read as an image. Save it as PNG and try again.`
      }
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
        this.linkSlot(slideId, slotIndex)
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

    /**
     * Put imported rows of text onto slides. 'fill' replaces text on the
     * content slides (everything but cover and call to action) in order and
     * adds slides for leftover rows; 'add' makes a new slide per row.
     */
    importText(rows: TextRow[], mode: 'fill' | 'add') {
      const targets = mode === 'fill' ? this.project.slides.filter((s) => s.type !== 'cover' && s.type !== 'cta') : []
      let added = 0
      let skipped = 0
      for (const [i, row] of rows.entries()) {
        let slide = targets[i]
        if (!slide) {
          if (!this.canAdd) { skipped++; continue }
          slide = this.insertSlide(createSlide(row.type ?? 'image'), this.endOfContent)
          added++
        } else if (row.type && row.type !== slide.type) {
          changeSlideType(slide, row.type)
        }
        Object.assign(slide, { title: row.title, body: row.body })
      }
      syncPanoramas(this.project.slides)
      const parts = [`Imported ${rows.length - skipped} row${rows.length - skipped === 1 ? '' : 's'}`]
      if (added) parts.push(`added ${added} slide${added === 1 ? '' : 's'}`)
      if (skipped) parts.push(`${skipped} didn't fit (${MAX_SLIDES} slides max)`)
      this.status = parts.join(', ') + '.'
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
      syncPanoramas(this.project.slides)
    },

    duplicateSlide(id: string) {
      if (!this.canAdd) return
      const index = this.indexOf(id)
      this.insertSlide(cloneSlide(this.project.slides[index]), index + 1)
      syncPanoramas(this.project.slides)
    },

    removeSlide(id: string) {
      if (this.project.slides.length <= 1) return
      this.project.slides.splice(this.indexOf(id), 1)
      syncPanoramas(this.project.slides)
    },

    /** Move a slide so it lands before the slide currently at `toIndex` (length = end). */
    moveSlide(id: string, toIndex: number) {
      const from = this.indexOf(id)
      const [slide] = this.project.slides.splice(from, 1)
      const to = clamp(toIndex > from ? toIndex - 1 : toIndex, 0, this.project.slides.length)
      this.project.slides.splice(to, 0, slide)
      syncPanoramas(this.project.slides)
    },

    indexOf(id: string): number {
      const index = this.project.slides.findIndex((s) => s.id === id)
      if (index < 0) throw new Error(`No slide ${id}`)
      return index
    },

    updateSlide(id: string, patch: Partial<Pick<Slide, 'title' | 'body' | 'alt'>>) {
      Object.assign(this.slide(id), patch)
    },

    changeType(id: string, type: SlideType) {
      changeSlideType(this.slide(id), type)
      syncPanoramas(this.project.slides)
    },

    updateSlot(id: string, slotIndex: number, patch: Partial<ImageSlot>) {
      Object.assign(this.slide(id).images[slotIndex], patch)
      this.linkSlot(id, slotIndex)
    },

    /** Panorama slides share one image: copy a changed slot to the rest of the run. */
    linkSlot(id: string, slotIndex: number) {
      const index = this.indexOf(id)
      const slides = this.project.slides
      if (slides[index].type !== 'panorama' || slotIndex !== 0) return
      const { start, count } = panoramaRun(slides, index)
      const source = slides[index].images[0]
      for (let i = start; i < start + count; i++) if (i !== index) Object.assign(slides[i].images[0], source)
    },

    updateAdjust(id: string, patch: Partial<Adjustments>) {
      Object.assign(this.slide(id).adjust, patch)
    },

    resetAdjust(id: string) {
      this.slide(id).adjust = neutralAdjustments()
    },

    setTextAlign(id: string, align: Align) {
      const text = this.slide(id).text
      Object.assign(text, { align, x: alignX(align) })
    },

    snapText(id: string, anchor: Anchor) {
      const text = this.slide(id).text
      Object.assign(text, { anchor, y: snapY(anchor) })
    },

    /** Store the text position that draws the block at `box` (slide pixels). */
    settleText(id: string, box: Rect) {
      const slide = this.slide(id)
      slide.text = layoutFromBox(slide.text, box, this.doc.width, this.doc.height)
    },

    /** Pan by a distance in slide pixels (e.g. from a pointer drag). */
    panBy(id: string, slotIndex: number, dx: number, dy: number) {
      const slide = this.slide(id)
      const slot = slide.images[slotIndex]
      const img = slot.asset ? useAssetStore().images[slot.asset] : undefined
      if (!img) return
      const frame = slotFrames(slide, this.doc)[slotIndex]
      const { marginX, marginY } = fitImage(img, slot.zoom, frame.w, frame.h)
      if (marginX > 0) slot.px = clamp(slot.px + dx / marginX, -1, 1)
      if (marginY > 0) slot.py = clamp(slot.py + dy / marginY, -1, 1)
      this.linkSlot(id, slotIndex)
    },

    /** Pan by a fraction of the pan range (e.g. from arrow keys). */
    nudge(id: string, slotIndex: number, dx: number, dy: number) {
      const slot = this.slide(id).images[slotIndex]
      slot.px = clamp(slot.px + dx, -1, 1)
      slot.py = clamp(slot.py + dy, -1, 1)
      this.linkSlot(id, slotIndex)
    },

    async downloadSlide(id: string) {
      await this.ensureFonts()
      const index = this.indexOf(id)
      const slide = this.project.slides[index]
      downloadBlob(await renderToBlob(slide, this.doc), slideFileName(slide, index, this.project.export.format))
    },

    async downloadPdf() {
      await this.ensureFonts()
      const name = `${projectSlug(this.doc)}.pdf`
      downloadBlob(await pdfSlides(this.doc), name)
      this.status = `Downloaded ${name}. Upload it to LinkedIn as a document post for a swipeable carousel.`
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
