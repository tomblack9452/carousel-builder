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
  <div class="add">
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
  gap: 10px;
  min-height: 240px;
  padding: 20px;
  border: 1px dashed var(--line);
  border-radius: 10px;
}
.title {
  margin: 0;
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 600;
  font-size: 20px;
}
.btn:disabled { opacity: 0.5; cursor: default; }
</style>
