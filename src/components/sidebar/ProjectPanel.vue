<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { ASPECTS } from '../../constants'
import { useBrandStore } from '../../stores/brand'
import { useProjectStore } from '../../stores/project'
import ImportTextDialog from '../ImportTextDialog.vue'
import SidebarSection from './SidebarSection.vue'

export default defineComponent({
  name: 'ProjectPanel',
  components: { ImportTextDialog, SidebarSection },
  data() {
    return { ASPECTS }
  },
  computed: {
    ...mapStores(useProjectStore, useBrandStore),
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
      if (window.confirm('Start a new project? Your current slides will be replaced.')) {
        this.projectStore.newProject(this.brandStore.kit)
      }
    },
    openImport() {
      (this.$refs.importDialog as InstanceType<typeof ImportTextDialog>).open()
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
    <p class="hint save" :class="projectStore.saveState">{{ saveNote }}</p>

    <p class="field-label">Slide size</p>
    <div class="segmented" role="group" aria-label="Slide size">
      <button
        v-for="(a, id) in ASPECTS"
        :key="id"
        type="button"
        :aria-pressed="projectStore.project.aspect === id"
        :title="a.label"
        @click="projectStore.project.aspect = id"
      >
        {{ id }}<small>{{ a.width }}×{{ a.height }}</small>
      </button>
    </div>

    <div class="stack">
      <button class="btn" @click="openImport">Import text from a spreadsheet</button>
      <button class="btn" @click="projectStore.copyShareLink()">Copy share link</button>
    </div>
    <ImportTextDialog ref="importDialog" />
  </SidebarSection>
</template>

<style scoped>
.save::before { content: ''; display: inline-block; width: 6px; height: 6px; margin: 0 6px 1px 0; border-radius: 50%; background: var(--text-3); }
.save.saved::before { background: var(--success); }
.save.unavailable::before { background: var(--warn); }
.segmented button { height: 38px; line-height: 1.25; }
.segmented button small { display: block; font-size: 10px; font-weight: 400; color: var(--text-3); font-variant-numeric: tabular-nums; }
.stack { display: grid; gap: 6px; margin-top: 14px; }
</style>
