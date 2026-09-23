<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useProjectStore } from '../../stores/project'
import SidebarSection from './SidebarSection.vue'

export default defineComponent({
  name: 'ExportPanel',
  components: { SidebarSection },
  computed: {
    ...mapStores(useProjectStore),
  },
  methods: {
    openBulkPicker() {
      (this.$refs.bulk as HTMLInputElement).click()
    },
    onQuality(event: Event) {
      this.projectStore.project.export.quality = Number((event.target as HTMLInputElement).value)
    },
    onBulkChange(event: Event) {
      const input = event.target as HTMLInputElement
      this.projectStore.loadBulk([...(input.files ?? [])])
      input.value = ''
    },
  },
})
</script>

<template>
  <SidebarSection title="Images and export">
    <div class="stack">
      <button class="btn" @click="openBulkPicker">Load images at once</button>
      <input ref="bulk" type="file" accept="image/*" multiple hidden @change="onBulkChange">
      <p class="hint">
        Files fill the image slides in filename order (name them 01.jpg, 02.jpg and so on), adding slides if
        needed. The first one also becomes the cover if it's empty.
      </p>
      <div class="format">
        <label for="format">Format</label>
        <select id="format" v-model="projectStore.project.export.format">
          <option value="jpg">JPG</option>
          <option value="png">PNG (larger files)</option>
        </select>
      </div>
      <template v-if="projectStore.project.export.format === 'jpg'">
        <label for="quality">
          JPG quality <span class="value">{{ Math.round(projectStore.project.export.quality * 100) }}%</span>
        </label>
        <input
          id="quality" type="range" min="0.6" max="1" step="0.01"
          :value="projectStore.project.export.quality" @input="onQuality"
        >
      </template>
      <button class="btn primary" @click="projectStore.downloadAll()">
        Download all {{ projectStore.project.slides.length }} slides (zip)
      </button>
      <button class="btn" @click="projectStore.downloadPdf()">Download as PDF</button>
      <p class="hint">The PDF has one slide per page, ready for a LinkedIn document post.</p>
    </div>
  </SidebarSection>
</template>

<style scoped>
.stack { display: grid; gap: 10px; margin-top: 10px; }
.stack label { margin: 4px 0 0; }
.stack select, .stack input[type=range] { width: 100%; }
.value { float: right; font-weight: 400; color: var(--muted); }
</style>
