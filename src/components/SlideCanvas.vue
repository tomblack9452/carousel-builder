<script lang="ts">
import { defineComponent, watchEffect, type PropType, type WatchStopHandle } from 'vue'
import { mapStores } from 'pinia'
import { W, H } from '../constants'
import { renderSlide } from '../render'
import { useProjectStore } from '../stores/project'
import type { Slide } from '../types'

const NUDGE_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-0.05, 0],
  ArrowRight: [0.05, 0],
  ArrowUp: [0, -0.05],
  ArrowDown: [0, 0.05],
}

export default defineComponent({
  name: 'SlideCanvas',
  props: {
    slide: { type: Object as PropType<Slide>, required: true },
    index: { type: Number, required: true },
    /** False for slides with no image of their own (drag/zoom/click-to-pick disabled). */
    interactive: { type: Boolean, default: true },
  },
  emits: ['pick'],
  data() {
    return {
      W,
      H,
      drag: null as { x: number; y: number } | null,
      stopRender: null as WatchStopHandle | null,
    }
  },
  computed: {
    ...mapStores(useProjectStore),
  },
  mounted() {
    const ctx = (this.$refs.canvas as HTMLCanvasElement).getContext('2d')
    if (!ctx) return
    // Re-renders whenever anything the renderer reads changes: this slide,
    // the shared settings, or (for the end slide) whichever image it blurs.
    this.stopRender = watchEffect(() => {
      void this.projectStore.fontsReady
      renderSlide(ctx, this.slide, this.projectStore.doc)
    })
  },
  unmounted() {
    this.stopRender?.()
  },
  methods: {
    onPointerDown(event: PointerEvent) {
      if (!this.interactive) return
      if (!this.slide.img) {
        this.$emit('pick')
        return
      }
      this.drag = { x: event.clientX, y: event.clientY }
      ;(event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId)
    },
    onPointerMove(event: PointerEvent) {
      if (!this.drag) return
      // Convert on-screen pixels to slide pixels.
      const k = W / (event.currentTarget as HTMLCanvasElement).clientWidth
      const dx = (event.clientX - this.drag.x) * k
      const dy = (event.clientY - this.drag.y) * k
      this.drag = { x: event.clientX, y: event.clientY }
      this.projectStore.panBy(this.index, dx, dy)
    },
    stopDrag() {
      this.drag = null
    },
    onKeydown(event: KeyboardEvent) {
      if (!this.interactive) return
      if (!this.slide.img) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          this.$emit('pick')
        }
        return
      }
      const step = NUDGE_KEYS[event.key]
      if (step) {
        event.preventDefault()
        this.projectStore.nudge(this.index, step[0], step[1])
      }
    },
  },
})
</script>

<template>
  <canvas
    ref="canvas"
    :width="W"
    :height="H"
    tabindex="0"
    :aria-label="`Slide ${index + 1} preview`"
    :class="{ interactive, empty: interactive && !slide.img, dragging: drag }"
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
  aspect-ratio: 4 / 5;
  border-radius: 4px;
  background: #000;
  touch-action: none;
}
canvas.interactive { cursor: grab; }
canvas.empty { cursor: pointer; }
canvas.dragging { cursor: grabbing; }
</style>
