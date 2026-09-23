<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { MAX_SLIDES } from '../constants'
import { SLIDE_TYPE_ORDER, SLIDE_TYPES } from '../model/slideTypes'
import { useProjectStore } from '../stores/project'
import type { SlideType } from '../types'

export default defineComponent({
  name: 'AddSlideCard',
  data() {
    return { type: 'image' as SlideType, MAX_SLIDES }
  },
  computed: {
    ...mapStores(useProjectStore),
    typeOptions(): { value: SlideType; label: string }[] {
      return SLIDE_TYPE_ORDER.map((value) => ({ value, label: SLIDE_TYPES[value].label }))
    },
  },
})
</script>

<template>
  <div class="add" :class="{ full: !projectStore.canAdd }">
    <svg class="plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
    <p class="title">Add a slide</p>
    <select v-model="type" aria-label="New slide type">
      <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <button class="btn primary" :disabled="!projectStore.canAdd" @click="projectStore.addSlide(type)">Add slide</button>
    <p class="hint">
      {{ projectStore.canAdd
        ? `${projectStore.project.slides.length} of ${MAX_SLIDES} slides used.`
        : `Instagram allows up to ${MAX_SLIDES} slides.` }}
    </p>
  </div>
</template>

<style scoped>
.add {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  min-height: 300px;
  padding: 24px;
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  transition: border-color 0.12s, background-color 0.12s;
}
.add:hover { border-color: var(--text-3); background: color-mix(in srgb, var(--panel) 50%, transparent); }
.plus { width: 22px; height: 22px; margin-bottom: 4px; fill: none; stroke: var(--text-2); stroke-width: 1.7; stroke-linecap: round; }
.title { margin: 0 0 4px; font-size: 14px; font-weight: 600; }
</style>
