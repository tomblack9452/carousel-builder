<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useBrandStore } from './stores/brand'
import { useHistoryStore } from './stores/history'
import { useProjectStore } from './stores/project'
import { useTemplateStore } from './stores/templates'
import AppSidebar from './components/AppSidebar.vue'
import IconButton from './components/IconButton.vue'
import PhonePreview from './components/PhonePreview.vue'
import SlideGrid from './components/SlideGrid.vue'

/** Text fields keep the browser's own undo. */
function isTextField(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

export default defineComponent({
  name: 'App',
  components: { AppSidebar, IconButton, PhonePreview, SlideGrid },
  computed: {
    ...mapStores(useProjectStore, useHistoryStore, useBrandStore, useTemplateStore),
  },
  mounted() {
    this.templatesStore.load()
    this.brandStore.load()
      .then(() => this.projectStore.init(this.brandStore.assetIds))
      .then(() => this.historyStore.start())
    window.addEventListener('keydown', this.onKeydown)
  },
  watch: {
    // Canvas text only uses a web font once it's loaded, so load the chosen pair and redraw.
    'projectStore.project.theme.fontPair': {
      handler() {
        this.projectStore.ensureFonts()
      },
      immediate: true,
    },
  },
  unmounted() {
    window.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    openPreview() {
      (this.$refs.preview as InstanceType<typeof PhonePreview>).open()
    },
    onKeydown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || isTextField(event.target)) return
      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        this.historyStore.undo()
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault()
        this.historyStore.redo()
      }
    },
  },
})
</script>

<template>
  <div class="app">
    <AppSidebar />
    <main>
      <div class="toolbar">
        <IconButton icon="undo" label="Undo (Ctrl+Z)" :disabled="!historyStore.canUndo" @click="historyStore.undo()" />
        <IconButton icon="redo" label="Redo (Ctrl+Y)" :disabled="!historyStore.canRedo" @click="historyStore.redo()" />
        <button class="btn preview-btn" @click="openPreview">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2" /></svg>
          Preview
        </button>
        <p class="status" role="status">{{ projectStore.status }}</p>
      </div>
      <SlideGrid />
    </main>
    <PhonePreview ref="preview" />
  </div>
</template>

<style scoped>
.app { display: grid; grid-template-columns: 300px 1fr; min-height: 100vh; }
main { padding: 24px; }
.toolbar { display: flex; align-items: center; gap: 8px; margin: 0 0 16px; }
.status { color: var(--amber); margin: 0 0 0 8px; }
.preview-btn { gap: 6px; padding: 6px 12px; }
.preview-btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }

@media (max-width: 760px) {
  .app { grid-template-columns: 1fr; }
}
</style>
