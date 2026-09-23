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
  <details class="adjust">
    <summary>Adjust image<span v-if="changed" class="dot" aria-label="(changed)" /></summary>
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
.adjust { margin: 8px 0 0; }
summary { cursor: pointer; font-weight: 600; font-size: 14px; color: var(--muted); }
.dot { display: inline-block; width: 7px; height: 7px; margin-left: 6px; border-radius: 50%; background: var(--amber); }
.control { display: grid; margin: 8px 0 0; font-size: 13px; }
.control input { width: 100%; }
.value { float: right; font-weight: 400; color: var(--muted); }
.reset { width: 100%; margin-top: 8px; padding: 6px; }
.reset:disabled { opacity: 0.5; cursor: default; }
</style>
