<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { mapStores } from 'pinia'
import { useProjectStore } from '../stores/project'
import type { Adjustments, Slide } from '../types'

interface Control {
  key: keyof Adjustments
  label: string
  min: number
  max: number
  /** Shown value for the current setting. */
  format: (v: number) => string
}

const pct = (v: number) => `${Math.round(v * 100)}%`
const signed = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v * 100)}`

const CONTROLS: Control[] = [
  { key: 'brightness', label: 'Brightness', min: 0.5, max: 1.5, format: pct },
  { key: 'saturation', label: 'Saturation', min: 0, max: 2, format: pct },
  { key: 'warmth', label: 'Warmth', min: -1, max: 1, format: signed },
  { key: 'vignette', label: 'Vignette', min: 0, max: 1, format: pct },
]

export default defineComponent({
  name: 'SlideAdjustments',
  props: {
    slide: { type: Object as PropType<Slide>, required: true },
    index: { type: Number, required: true },
  },
  data() {
    return { CONTROLS }
  },
  computed: {
    ...mapStores(useProjectStore),
    changed(): boolean {
      const a = this.slide.adjust
      return a.brightness !== 1 || a.saturation !== 1 || a.warmth !== 0 || a.vignette !== 0
    },
  },
  methods: {
    onInput(key: keyof Adjustments, event: Event) {
      this.projectStore.updateAdjust(this.slide.id, { [key]: Number((event.target as HTMLInputElement).value) })
    },
  },
})
</script>

<template>
  <details class="adjust disclosure">
    <summary>Adjust image<span v-if="changed" class="set-dot" aria-label="(changed)" /></summary>
    <label v-for="c in CONTROLS" :key="c.key" class="control">
      <span>{{ c.label }} <span class="value">{{ c.format(slide.adjust[c.key]) }}</span></span>
      <input
        type="range"
        :min="c.min"
        :max="c.max"
        step="0.01"
        :value="slide.adjust[c.key]"
        :aria-label="`Slide ${index + 1} ${c.label}`"
        @input="onInput(c.key, $event)"
      >
    </label>
    <button class="btn reset" :disabled="!changed" @click="projectStore.resetAdjust(slide.id)">Reset</button>
  </details>
</template>

<style scoped>
.adjust { margin: 10px 0 0; }
summary { color: var(--text-2); font-size: 12px; }
summary:hover, .adjust[open] > summary { color: var(--text); }
.control { display: grid; gap: 3px; margin: 10px 0 0; font-size: 12px; color: var(--text-2); }
.control input { width: 100%; }
.reset { width: 100%; height: 26px; margin-top: 10px; font-size: 12px; }
</style>
