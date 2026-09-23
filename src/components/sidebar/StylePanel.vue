<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { FONT_PAIRS, type FontPair, fontPair, nearestWeight, stack } from '../../fonts/catalog'
import { PRESETS, matchingPreset, presetTheme } from '../../model/presets'
import { useProjectStore } from '../../stores/project'
import type { Theme } from '../../types'
import SidebarSection from './SidebarSection.vue'

const WEIGHT_NAMES: Record<number, string> = {
  400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold', 900: 'Black',
}

export default defineComponent({
  name: 'StylePanel',
  components: { SidebarSection },
  data() {
    return { FONT_PAIRS, PRESETS }
  },
  computed: {
    ...mapStores(useProjectStore),
    theme(): Theme {
      return this.projectStore.project.theme
    },
    activePreset(): string | null {
      return matchingPreset(this.theme)
    },
    pair(): FontPair {
      return fontPair(this.theme.fontPair)
    },
    weightOptions(): { value: number; label: string }[] {
      return this.pair.heading.weights.map((w) => ({ value: w, label: WEIGHT_NAMES[w] ?? String(w) }))
    },
    /** The weight actually drawn, since not every font has every weight. */
    headingWeight(): number {
      return nearestWeight(this.pair.heading, this.theme.headingWeight)
    },
    previewStyle(): Record<string, string> {
      return {
        fontFamily: stack(this.pair.heading),
        fontWeight: String(this.headingWeight),
        letterSpacing: `${this.theme.letterSpacing}em`,
        textTransform: this.theme.uppercase ? 'uppercase' : 'none',
      }
    },
    bodyPreviewStyle(): Record<string, string> {
      return { fontFamily: stack(this.pair.body) }
    },
  },
  methods: {
    applyPreset(id: string) {
      this.projectStore.project.theme = presetTheme(id)
    },
    setNumber(key: 'headingWeight' | 'headingScale' | 'bodyScale' | 'letterSpacing' | 'overlayStrength', event: Event) {
      this.theme[key] = Number((event.target as HTMLInputElement).value)
    },
    percent(value: number): string {
      return `${Math.round(value * 100)}%`
    },
  },
})
</script>

<template>
  <SidebarSection title="Style">
    <p class="field-label">Presets</p>
    <div class="presets">
      <button
        v-for="p in PRESETS"
        :key="p.id"
        type="button"
        class="preset"
        :class="{ active: activePreset === p.id }"
        :aria-pressed="activePreset === p.id"
        @click="applyPreset(p.id)"
      >
        <span class="swatch" :style="{ background: p.theme.background }">
          <span :style="{ background: p.theme.accent }" />
          <span :style="{ background: p.theme.text }" />
        </span>
        {{ p.label }}
      </button>
    </div>

    <label for="handle">Your handle</label>
    <input id="handle" v-model="projectStore.project.handle" type="text">

    <label for="fontPair">Fonts</label>
    <select id="fontPair" v-model="theme.fontPair">
      <option v-for="p in FONT_PAIRS" :key="p.id" :value="p.id">{{ p.label }}</option>
    </select>
    <div class="preview" aria-hidden="true">
      <span class="preview-heading" :style="previewStyle">Heading</span>
      <span class="preview-body" :style="bodyPreviewStyle">Body text looks like this</span>
    </div>

    <template v-if="weightOptions.length > 1">
      <label for="headingWeight">Heading weight</label>
      <select id="headingWeight" :value="headingWeight" @change="setNumber('headingWeight', $event)">
        <option v-for="w in weightOptions" :key="w.value" :value="w.value">{{ w.label }}</option>
      </select>
    </template>

    <label for="headingScale">Heading size <span class="value">{{ percent(theme.headingScale) }}</span></label>
    <input
      id="headingScale" type="range" min="0.6" max="1.4" step="0.05"
      :value="theme.headingScale" @input="setNumber('headingScale', $event)"
    >

    <label for="bodyScale">Body size <span class="value">{{ percent(theme.bodyScale) }}</span></label>
    <input
      id="bodyScale" type="range" min="0.6" max="1.4" step="0.05"
      :value="theme.bodyScale" @input="setNumber('bodyScale', $event)"
    >

    <label for="letterSpacing">Heading letter spacing <span class="value">{{ theme.letterSpacing.toFixed(2) }}em</span></label>
    <input
      id="letterSpacing" type="range" min="-0.05" max="0.2" step="0.01"
      :value="theme.letterSpacing" @input="setNumber('letterSpacing', $event)"
    >

    <label class="check">
      <input v-model="theme.uppercase" type="checkbox">
      Uppercase headings
    </label>

    <div class="colours">
      <label>
        <input v-model="theme.accent" type="color">
        Accent
      </label>
      <label>
        <input v-model="theme.text" type="color">
        Text
      </label>
      <label>
        <input v-model="theme.background" type="color">
        Background
      </label>
      <label>
        <input v-model="theme.overlay" type="color">
        Overlay
      </label>
    </div>
    <p class="hint">Accent colours title effects, list numbers and labels. Background shows on slides without an image.</p>

    <label for="titleEffect">Title effect</label>
    <select id="titleEffect" v-model="theme.titleEffect">
      <option value="hard">Hard shadow</option>
      <option value="glow">Glow</option>
      <option value="none">None</option>
    </select>

    <p class="field-label">Swipe cues</p>
    <label class="check"><input v-model="projectStore.project.cues.numbers" type="checkbox"> Slide numbers (3/10)</label>
    <label class="check"><input v-model="projectStore.project.cues.dots" type="checkbox"> Progress dots</label>
    <label class="check"><input v-model="projectStore.project.cues.arrow" type="checkbox"> Swipe arrow</label>

    <label for="overlayStrength">Image overlay <span class="value">{{ percent(theme.overlayStrength) }}</span></label>
    <input
      id="overlayStrength" type="range" min="0" max="1.5" step="0.05"
      :value="theme.overlayStrength" @input="setNumber('overlayStrength', $event)"
    >
  </SidebarSection>
</template>

<style scoped>
select, input[type=range] { width: 100%; }
.value { float: right; font-weight: 400; color: var(--muted); }
.check { display: flex; align-items: center; gap: 8px; font-weight: 600; margin: 8px 0 0; }
.check input { accent-color: var(--amber); width: 16px; height: 16px; margin: 0; }
.presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.preset {
  display: grid;
  justify-items: start;
  gap: 5px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--dusk);
  color: var(--text);
  font: 600 13px Barlow, sans-serif;
  cursor: pointer;
}
.preset:hover { border-color: var(--muted); }
.preset.active { border-color: var(--amber); }
.swatch {
  display: flex;
  gap: 3px;
  width: 100%;
  padding: 6px;
  border-radius: 4px;
}
.swatch span { width: 12px; height: 12px; border-radius: 50%; }
.colours { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; margin-top: 14px; }
.colours label { display: flex; align-items: center; gap: 8px; margin: 0; font-weight: 600; }
.preview {
  display: grid;
  gap: 2px;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--dusk);
  overflow: hidden;
}
.preview-heading { font-size: 28px; line-height: 1.1; white-space: nowrap; }
.preview-body { font-size: 14px; color: var(--muted); }
</style>
