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
      <button class="btn primary" @click="projectStore.downloadAll()">
        Download all {{ projectStore.project.slides.length }} slides
      </button>
    </div>
  </SidebarSection>
</template>

<style scoped>
.stack { display: grid; gap: 10px; margin-top: 10px; }
</style>
