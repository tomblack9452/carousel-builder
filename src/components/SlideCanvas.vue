<script lang="ts">
import { defineComponent, watchEffect, type PropType, type WatchStopHandle } from 'vue'
import { mapStores } from 'pinia'
import { SLIDE_TYPES } from '../model/slideTypes'
import { renderSlide, slotFrames } from '../render'
import { clamp, contains } from '../render/geometry'
import { TEXT_SAFE } from '../render/text'
import { useProjectStore } from '../stores/project'
import type { ImageSlot, Rect, Slide } from '../types'

const NUDGE_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-0.05, 0],
  ArrowRight: [0.05, 0],
  ArrowUp: [0, -0.05],
  ArrowDown: [0, 0.05],
}

/** Extra grab margin around the text block, in slide pixels. */
const TEXT_HIT_PAD = 24

interface Drag {
  /** Dragging the text block, or panning an image slot. */
  mode: 'text' | 'image'
  x: number
  y: number
  slot: number
  /** Text block position during a text drag. */
  box?: Rect
}

export default defineComponent({
  name: 'SlideCanvas',
  props: {
    slide: { type: Object as PropType<Slide>, required: true },
    index: { type: Number, required: true },
  },
  emits: {
    /** Ask the parent to open a file picker for an image slot. */
    pick: (slot: number) => slot >= 0,
  },
  data() {
    return {
      drag: null as Drag | null,
      /** Where the text block was last drawn, in slide pixels. */
      textBox: null as Rect | null,
      overText: false,
      stopRender: null as WatchStopHandle | null,
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
  },
  mounted() {
    const canvas = this.$refs.canvas as HTMLCanvasElement
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Re-renders whenever anything the renderer reads changes: this slide,
    // project settings, or another slide's image it borrows.
    this.stopRender = watchEffect(() => {
      void this.projectStore.fontsVersion
      const doc = this.projectStore.doc
      if (canvas.width !== doc.width) canvas.width = doc.width
      if (canvas.height !== doc.height) canvas.height = doc.height
      this.textBox = renderSlide(ctx, this.slide, doc)
    })
  },
  unmounted() {
    this.stopRender?.()
  },
  methods: {
    /** Pointer position in slide pixels. */
    toSlide(event: PointerEvent): { x: number; y: number; k: number } {
      const canvas = event.currentTarget as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()
      const k = canvas.width / rect.width
      return { x: (event.clientX - rect.left) * k, y: (event.clientY - rect.top) * k, k }
    },
    slotAt(x: number, y: number): number {
      const frames = slotFrames(this.slide, this.projectStore.doc.width, this.projectStore.doc.height)
      const hit = frames.findIndex((f, i) => i < this.slots.length && contains(f, x, y))
      return Math.max(0, hit)
    },
    hitsText(x: number, y: number): boolean {
      const b = this.textBox
      if (!b) return false
      const p = TEXT_HIT_PAD
      return contains({ x: b.x - p, y: b.y - p, w: b.w + p * 2, h: b.h + p * 2 }, x, y)
    },
    onPointerDown(event: PointerEvent) {
      const { x, y } = this.toSlide(event)
      const canvas = event.currentTarget as HTMLCanvasElement
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
        this.overText = this.hitsText(x, y)
        return
      }
      const dx = (event.clientX - this.drag.x) * k
      const dy = (event.clientY - this.drag.y) * k
      this.drag = { ...this.drag, x: event.clientX, y: event.clientY }
      if (this.drag.box) this.drag.box = this.shiftText(this.drag.box, dx, dy)
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
</style>
