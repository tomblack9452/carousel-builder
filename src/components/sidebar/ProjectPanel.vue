<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { ASPECTS } from '../../constants'
import { useProjectStore } from '../../stores/project'
import SidebarSection from './SidebarSection.vue'

export default defineComponent({
  name: 'ProjectPanel',
  components: { SidebarSection },
  data() {
    return { ASPECTS }
  },
  computed: {
    ...mapStores(useProjectStore),
    saveNote(): string {
      switch (this.projectStore.saveState) {
        case 'saved': return 'Changes are saved in this browser automatically.'
        case 'unavailable': return "This browser isn't allowing storage, so use Save to keep your work."
        default: return ''
      }
    },
  },
  methods: {
    newProject() {
      if (window.confirm('Start a new project? Your current slides will be replaced.')) this.projectStore.newProject()
    },
    openPicker() {
      (this.$refs.file as HTMLInputElement).click()
    },
    onFile(event: Event) {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      if (file) this.projectStore.openProjectFile(file)
      input.value = ''
    },
  },
})
</script>

<template>
  <SidebarSection title="Project">
    <div class="row">
      <button class="btn" @click="newProject">New</button>
      <button class="btn" @click="openPicker">Open</button>
      <button class="btn" @click="projectStore.saveProjectFile()">Save</button>
    </div>
    <input ref="file" type="file" accept=".json,application/json" hidden @change="onFile">
    <p class="hint">{{ saveNote }}</p>

    <label for="aspect">Slide size</label>
    <select id="aspect" v-model="projectStore.project.aspect">
      <option v-for="(a, id) in ASPECTS" :key="id" :value="id">{{ a.label }}</option>
    </select>
  </SidebarSection>
</template>

<style scoped>
select { width: 100%; }
</style>
