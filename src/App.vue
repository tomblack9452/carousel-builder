<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useHistoryStore } from './stores/history'
import { useProjectStore } from './stores/project'
import AppSidebar from './components/AppSidebar.vue'
import IconButton from './components/IconButton.vue'
import SlideGrid from './components/SlideGrid.vue'

/** Text fields keep the browser's own undo. */
function isTextField(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

export default defineComponent({
  name: 'App',
  components: { AppSidebar, IconButton, SlideGrid },
  computed: {
    ...mapStores(useProjectStore, useHistoryStore),
  },
  mounted() {
    this.projectStore.init().then(() => this.historyStore.start())
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
        <p class="status" role="status">{{ projectStore.status }}</p>
      </div>
      <SlideGrid />
    </main>
  </div>
</template>

<style scoped>
.app { display: grid; grid-template-columns: 300px 1fr; min-height: 100vh; }
main { padding: 24px; }
.toolbar { display: flex; align-items: center; gap: 8px; margin: 0 0 16px; }
.status { color: var(--amber); margin: 0 0 0 8px; }

@media (max-width: 760px) {
  .app { grid-template-columns: 1fr; }
}
</style>
