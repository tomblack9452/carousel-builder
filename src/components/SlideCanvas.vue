<script lang="ts">
import { defineComponent, watchEffect, type PropType, type WatchStopHandle } from 'vue'
import { mapStores } from 'pinia'
import { SLIDE_TYPES } from '../model/slideTypes'
import { slideVideo } from '../export/video'
import { renderSlide, slotFrames } from '../render'
import { clamp, contains } from '../render/geometry'
import { stickerBox } from '../render/stickers'
import { TEXT_SAFE } from '../render/text'
import { useProjectStore } from '../stores/project'
import type { ImageSlot, Rect, RenderDoc, Slide, Sticker } from '../types'

const NUDGE_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-0.05, 0],
  ArrowRight: [0.05, 0],
  ArrowUp: [0, -0.05],
  ArrowDown: [0, 0.05],
}

/** Extra grab margin around the text block, in slide pixels. */
const TEXT_HIT_PAD = 24

/** Dashed selection frame around a sticker, following its rotation. */
function outlineSticker(ctx: CanvasRenderingContext2D, sticker: Sticker, doc: RenderDoc): void {
  const b = stickerBox(sticker, doc)
  ctx.save()
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2)
  ctx.rotate((sticker.rotation * Math.PI) / 180)
  ctx.setLineDash([14, 10])
  ctx.lineWidth = 4
  ctx.strokeStyle = '#ffb347'
  ctx.strokeRect(-b.w / 2 - 10, -b.h / 2 - 10, b.w + 20, b.h + 20)
  ctx.restore()
}

interface Drag {
  /** Dragging the text block, a sticker, or panning an image slot. */
  mode: 'text' | 'image' | 'sticker'
  x: number
  y: number
  slot: number
  /** Text block position during a text drag. */
  box?: Rect
  stickerId?: string
}

export default defineComponent({
  name: 'SlideCanvas',
  props: {
    slide: { type: Object as PropType<Slide>, required: true },
    index: { type: Number, required: true },
    /** Sticker to outline as selected (editor only, never exported). */
    selectedSticker: { type: String as PropType<string | null>, default: null },
  },
  emits: {
    /** Ask the parent to open a file picker for an image slot. */
    pick: (slot: number) => slot >= 0,
    /** A sticker was clicked (its id), or something else was (null). */
    select: (id: string | null) => id === null || typeof id === 'string',
  },
  data() {
    return {
      drag: null as Drag | null,
      /** Where the text block was last drawn, in slide pixels. */
      textBox: null as Rect | null,
      overText: false,
      stopRender: null as WatchStopHandle | null,
      /** Bumped every animation frame while a video plays, to redraw. */
      frameTick: 0,
      playing: false,
    }
  },
  computed: {
    ...mapStores(useProjectStore),
    /** The image slots this slide type actually uses. */
    slots(): ImageSlot[] {
      return this.slide.images.slice(0, SLIDE_TYPES[this.slide.type].imageSlots)
    },
    interactive(): boolean {
      return this.slots.length > 0
    },
    empty(): boolean {
      return this.interactive && this.slots.every((s) => !s.asset)
    },
    aspectRatio(): string {
      return `${this.projectStore.doc.width} / ${this.projectStore.doc.height}`
    },
    video(): HTMLVideoElement | null {
      return slideVideo(this.slide, this.projectStore.doc)
    },
  },
  watch: {
    // A new or removed video stops any preview that was playing.
    video(_next: HTMLVideoElement | null, previous: HTMLVideoElement | null) {
      previous?.pause()
      this.playing = false
    },
  },
  mounted() {
    const canvas = this.$refs.canvas as HTMLCanvasElement
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Re-renders whenever anything the renderer reads changes: this slide,
    // project settings, or another slide's image it borrows.
    this.stopRender = watchEffect(() => {
      void this.projectStore.fontsVersion
      void this.frameTick
      const doc = this.projectStore.doc
      if (canvas.width !== doc.width) canvas.width = doc.width
      if (canvas.height !== doc.height) canvas.height = doc.height
      this.textBox = renderSlide(ctx, this.slide, doc)
      const selected = this.slide.stickers.find((s) => s.id === this.selectedSticker)
      if (selected) outlineSticker(ctx, selected, doc)
    })
  },
  unmounted() {
    this.stopRender?.()
    this.video?.pause()
  },
  methods: {
    async togglePlay() {
      const video = this.video
      if (!video) return
      if (!video.paused) {
        video.pause()
        this.playing = false
        return
      }
      await video.play().catch(() => {})
      this.playing = !video.paused
      const tick = () => {
        this.frameTick++
        if (!video.paused && this.video === video) requestAnimationFrame(tick)
        else this.playing = false
      }
      requestAnimationFrame(tick)
    },
    /** Pointer position in slide pixels. */
    toSlide(event: PointerEvent): { x: number; y: number; k: number } {
      const canvas = event.currentTarget as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()
      const k = canvas.width / rect.width
      return { x: (event.clientX - rect.left) * k, y: (event.clientY - rect.top) * k, k }
    },
    slotAt(x: number, y: number): number {
      const frames = slotFrames(this.slide, this.projectStore.doc)
      const hit = frames.findIndex((f, i) => i < this.slots.length && contains(f, x, y))
      return Math.max(0, hit)
    },
    hitsText(x: number, y: number): boolean {
      const b = this.textBox
      if (!b) return false
      const p = TEXT_HIT_PAD
      return contains({ x: b.x - p, y: b.y - p, w: b.w + p * 2, h: b.h + p * 2 }, x, y)
    },
    /** Topmost sticker under a point, if any. */
    stickerAt(x: number, y: number): string | null {
      const doc = this.projectStore.doc
      for (let i = this.slide.stickers.length - 1; i >= 0; i--) {
        const s = this.slide.stickers[i]
        const b = stickerBox(s, doc)
        const pad = 12
        if (contains({ x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 }, x, y)) return s.id
      }
      return null
    },
    onPointerDown(event: PointerEvent) {
      const { x, y } = this.toSlide(event)
      const canvas = event.currentTarget as HTMLCanvasElement
      const stickerId = this.stickerAt(x, y)
      this.$emit('select', stickerId)
      if (stickerId) {
        this.drag = { mode: 'sticker', x: event.clientX, y: event.clientY, slot: 0, stickerId }
        canvas.setPointerCapture(event.pointerId)
        return
      }
      if (this.textBox && this.hitsText(x, y)) {
        this.drag = { mode: 'text', x: event.clientX, y: event.clientY, slot: 0, box: { ...this.textBox } }
        canvas.setPointerCapture(event.pointerId)
        return
      }
      if (!this.interactive) return
      const slot = this.slotAt(x, y)
      if (!this.slots[slot].asset) {
        this.$emit('pick', slot)
        return
      }
      this.drag = { mode: 'image', x: event.clientX, y: event.clientY, slot }
      canvas.setPointerCapture(event.pointerId)
    },
    onPointerMove(event: PointerEvent) {
      const { x, y, k } = this.toSlide(event)
      if (!this.drag) {
        this.overText = this.hitsText(x, y) || !!this.stickerAt(x, y)
        return
      }
      const dx = (event.clientX - this.drag.x) * k
      const dy = (event.clientY - this.drag.y) * k
      this.drag = { ...this.drag, x: event.clientX, y: event.clientY }
      const { width, height } = this.projectStore.doc
      const sticker = this.slide.stickers.find((s) => s.id === this.drag?.stickerId)
      if (sticker) {
        this.projectStore.updateSticker(this.slide.id, sticker.id, {
          x: clamp(sticker.x + dx / width, 0, 1),
          y: clamp(sticker.y + dy / height, 0, 1),
        })
      } else if (this.drag.box) this.drag.box = this.shiftText(this.drag.box, dx, dy)
      else this.projectStore.panBy(this.slide.id, this.drag.slot, dx, dy)
    },
    /** Move a text box by slide pixels, kept inside the safe area, and store the result. */
    shiftText(box: Rect, dx: number, dy: number): Rect {
      const { width, height } = this.projectStore.doc
      const moved = {
        ...box,
        x: clamp(box.x + dx, TEXT_SAFE, Math.max(TEXT_SAFE, width - TEXT_SAFE - box.w)),
        y: clamp(box.y + dy, TEXT_SAFE, Math.max(TEXT_SAFE, height - TEXT_SAFE - box.h)),
      }
      this.projectStore.settleText(this.slide.id, moved)
      return moved
    },
    stopDrag() {
      this.drag = null
    },
    onKeydown(event: KeyboardEvent) {
      // With a sticker selected, Delete removes the sticker rather than the slide.
      if (this.selectedSticker && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault()
        event.stopPropagation()
        this.projectStore.removeSticker(this.slide.id, this.selectedSticker)
        this.$emit('select', null)
        return
      }
      // Shift+arrows move the text; plain arrows pan the image.
      const step = NUDGE_KEYS[event.key]
      if (step && event.shiftKey) {
        event.preventDefault()
        const { width, height } = this.projectStore.doc
        if (this.textBox) this.shiftText(this.textBox, step[0] * width / 5, step[1] * height / 5)
        return
      }
      if (!this.interactive) return
      // Keyboard acts on the first slot that has an image, else offers a picker.
      const slot = this.slots.findIndex((s) => s.asset)
      if (slot < 0) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          this.$emit('pick', 0)
        }
        return
      }
      if (step) {
        event.preventDefault()
        this.projectStore.nudge(this.slide.id, slot, step[0], step[1])
      }
    },
  },
})
</script>

<template>
  <div class="wrap">
    <canvas
      ref="canvas"
      tabindex="0"
      :style="{ aspectRatio }"
      :aria-label="`Slide ${index + 1} preview`"
      :class="{ interactive, empty, dragging: drag, 'over-text': overText || drag?.mode === 'text' }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="stopDrag"
      @pointercancel="stopDrag"
      @pointerleave="overText = false"
      @keydown="onKeydown"
    />
    <button
      v-if="video"
      class="play"
      :aria-label="playing ? 'Pause video' : 'Play video'"
      @click="togglePlay"
    >
      {{ playing ? '❚❚' : '▶' }}
    </button>
  </div>
</template>

<style scoped>
canvas {
  display: block;
  width: 100%;
  border-radius: 4px;
  background: #000;
  touch-action: none;
}
canvas.interactive { cursor: grab; }
canvas.empty { cursor: pointer; }
canvas.dragging { cursor: grabbing; }
canvas.over-text { cursor: move; }
.wrap { position: relative; }
.play {
  position: absolute;
  left: 10px;
  bottom: 10px;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
.play:hover { background: rgba(0, 0, 0, 0.8); }
</style>
