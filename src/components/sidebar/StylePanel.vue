<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { FONT_PAIRS, type FontPair, fontPair, nearestWeight, stack } from '../../fonts/catalog'
import { PRESETS, matchingPreset, presetTheme } from '../../model/presets'
import { useProjectStore } from '../../stores/project'
import type { Theme, TitleEffect } from '../../types'
import SidebarSection from './SidebarSection.vue'

const WEIGHT_NAMES: Record<number, string> = {
  400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold', 900: 'Black',
}

const EFFECTS: { value: TitleEffect; label: string }[] = [
  { value: 'hard', label: 'Hard shadow' },
  { value: 'glow', label: 'Glow' },
  { value: 'none', label: 'None' },
]

export default defineComponent({
  name: 'StylePanel',
  components: { SidebarSection },
  data() {
    return { FONT_PAIRS, PRESETS, EFFECTS }
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
          <span class="bar" :style="{ background: p.theme.accent }" />
          <span class="bar short" :style="{ background: p.theme.text }" />
        </span>
        <span class="preset-name">{{ p.label }}</span>
      </button>
    </div>

    <label for="fontPair">Fonts</label>
    <select id="fontPair" v-model="theme.fontPair">
      <option v-for="p in FONT_PAIRS" :key="p.id" :value="p.id">{{ p.label }}</option>
    </select>
    <div class="specimen" aria-hidden="true">
      <span class="specimen-heading" :style="previewStyle">Heading</span>
      <span class="specimen-body" :style="bodyPreviewStyle">Body text looks like this</span>
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

    <p class="field-label">Colours</p>
    <div class="colours">
      <label><input v-model="theme.accent" type="color"><span>Accent<code>{{ theme.accent }}</code></span></label>
      <label><input v-model="theme.text" type="color"><span>Text<code>{{ theme.text }}</code></span></label>
      <label><input v-model="theme.background" type="color"><span>Background<code>{{ theme.background }}</code></span></label>
      <label><input v-model="theme.overlay" type="color"><span>Overlay<code>{{ theme.overlay }}</code></span></label>
    </div>
    <p class="hint">Accent colours title effects, list numbers and labels. Background shows on slides without an image.</p>
    <button class="btn match" @click="projectStore.matchColoursToCover()">Match colours to cover image</button>

    <p class="field-label">Title effect</p>
    <div class="segmented" role="group" aria-label="Title effect">
      <button
        v-for="e in EFFECTS"
        :key="e.value"
        type="button"
        :aria-pressed="theme.titleEffect === e.value"
        @click="theme.titleEffect = e.value"
      >
        {{ e.label }}
      </button>
    </div>

    <label for="overlayStrength">Image overlay <span class="value">{{ percent(theme.overlayStrength) }}</span></label>
    <input
      id="overlayStrength" type="range" min="0" max="1.5" step="0.05"
      :value="theme.overlayStrength" @input="setNumber('overlayStrength', $event)"
    >

    <p class="field-label">Swipe cues</p>
    <label class="check"><input v-model="projectStore.project.cues.numbers" type="checkbox"> Slide numbers (3/10)</label>
    <label class="check"><input v-model="projectStore.project.cues.dots" type="checkbox"> Progress dots</label>
    <label class="check"><input v-model="projectStore.project.cues.arrow" type="checkbox"> Swipe arrow</label>
  </SidebarSection>
</template>

<style scoped>
select, input[type=range] { width: 100%; }
.check { display: flex; align-items: center; gap: 8px; margin: 8px 0 0; color: var(--text); cursor: pointer; }
.check input { width: 14px; height: 14px; margin: 0; }

.presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.preset {
  display: grid;
  gap: 5px;
  padding: 4px 4px 6px;
  border: 0;
  border-radius: var(--radius);
  background: none;
  color: var(--text-2);
  font: 12px var(--font);
  text-align: center;
  cursor: pointer;
}
.preset:hover { background: var(--hover); color: var(--text); }
.preset.active { color: var(--text); }
.preset.active .swatch { box-shadow: 0 0 0 2px var(--panel), 0 0 0 4px var(--accent); }
.swatch { display: grid; align-content: end; gap: 3px; height: 40px; padding: 7px; border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(128, 128, 128, 0.25); }
.bar { display: block; width: 70%; height: 4px; border-radius: 2px; }
.bar.short { width: 42%; }

.specimen {
  display: grid;
  gap: 2px;
  margin-top: 6px;
  padding: 10px 12px;
  border-radius: var(--radius);
  background: var(--panel-sunken);
  box-shadow: inset 0 0 0 1px var(--border);
  overflow: hidden;
}
.specimen-heading { font-size: 26px; line-height: 1.1; white-space: nowrap; }
.specimen-body { font-size: 13px; color: var(--text-2); }

.colours { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.colours label { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--text); cursor: pointer; }
.colours span { display: grid; line-height: 1.25; }
.colours code { font: 11px var(--font); color: var(--text-3); text-transform: uppercase; font-variant-numeric: tabular-nums; }
.match { width: 100%; margin-top: 10px; }
</style>
