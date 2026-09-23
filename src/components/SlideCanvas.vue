<script lang="ts">
import { defineComponent, watchEffect, type PropType, type WatchStopHandle } from 'vue'
import { mapStores } from 'pinia'
import { SLIDE_TYPES } from '../model/slideTypes'
import { renderSlide, slotFrames } from '../render'
import { contains } from '../render/geometry'
import { useProjectStore } from '../stores/project'
import type { ImageSlot, Slide } from '../types'

const NUDGE_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-0.05, 0],
  ArrowRight: [0.05, 0],
  ArrowUp: [0, -0.05],
  ArrowDown: [0, 0.05],
}

interface Drag {
  x: number
  y: number
  slot: number
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
      void this.projectStore.fontsReady
      const doc = this.projectStore.doc
      if (canvas.width !== doc.width) canvas.width = doc.width
      if (canvas.height !== doc.height) canvas.height = doc.height
      renderSlide(ctx, this.slide, doc)
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
    onPointerDown(event: PointerEvent) {
      if (!this.interactive) return
      const { x, y } = this.toSlide(event)
      const slot = this.slotAt(x, y)
      if (!this.slots[slot].asset) {
        this.$emit('pick', slot)
        return
      }
      this.drag = { x: event.clientX, y: event.clientY, slot }
      ;(event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId)
    },
    onPointerMove(event: PointerEvent) {
      if (!this.drag) return
      const { k } = this.toSlide(event)
      const dx = (event.clientX - this.drag.x) * k
      const dy = (event.clientY - this.drag.y) * k
      this.drag = { ...this.drag, x: event.clientX, y: event.clientY }
      this.projectStore.panBy(this.slide.id, this.drag.slot, dx, dy)
    },
    stopDrag() {
      this.drag = null
    },
    onKeydown(event: KeyboardEvent) {
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
      const step = NUDGE_KEYS[event.key]
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
    :class="{ interactive, empty, dragging: drag }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="stopDrag"
    @pointercancel="stopDrag"
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
</style>
