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
import ShortcutsDialog from './components/ShortcutsDialog.vue'
import SlideGrid from './components/SlideGrid.vue'
import { MAX_SLIDES } from './constants'
import { isTextField } from './shortcuts'

/** The slide whose card holds keyboard focus, if any. */
function focusedSlideId(): string | null {
  return (document.activeElement?.closest('[data-slide-id]') as HTMLElement | null)?.dataset.slideId ?? null
}

function focusSlide(id: string | undefined): void {
  if (id) document.querySelector<HTMLElement>(`[data-slide-id="${id}"] canvas`)?.focus()
}

export default defineComponent({
  name: 'App',
  components: { AppSidebar, IconButton, PhonePreview, ShortcutsDialog, SlideGrid },
  data() {
    return { MAX_SLIDES }
  },
  computed: {
    ...mapStores(useProjectStore, useHistoryStore, useBrandStore, useTemplateStore),
  },
  mounted() {
    this.templatesStore.load()
    this.brandStore.load()
      .then(() => this.projectStore.init(this.brandStore.assetIds))
      .then(() => this.historyStore.start())
      .then(() => this.projectStore.openSharedFromUrl())
    window.addEventListener('keydown', this.onKeydown)
    // Editor text on canvases (drop prompts) uses the UI font: redraw once it arrives.
    document.fonts.addEventListener('loadingdone', this.onFontsLoaded)
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
    document.fonts.removeEventListener('loadingdone', this.onFontsLoaded)
  },
  methods: {
    onFontsLoaded() {
      this.projectStore.fontsVersion++
    },
    openPreview() {
      (this.$refs.preview as InstanceType<typeof PhonePreview>).open()
    },
    openShortcuts() {
      (this.$refs.shortcuts as InstanceType<typeof ShortcutsDialog>).open()
    },
    onKeydown(event: KeyboardEvent) {
      if (document.querySelector('dialog[open]')) return
      const key = event.key.toLowerCase()
      const mod = event.ctrlKey || event.metaKey
      const run = (action: () => void) => {
        event.preventDefault()
        action()
      }

      // These work even while typing.
      if (mod && key === 's') return run(() => this.projectStore.saveProjectFile())
      if (mod && key === 'e') return run(() => this.projectStore.downloadAll())
      if (isTextField(event.target)) return

      if (mod && key === 'z' && !event.shiftKey) return run(() => this.historyStore.undo())
      if (mod && (key === 'y' || (key === 'z' && event.shiftKey))) return run(() => this.historyStore.redo())
      if (event.key === '?') return run(() => this.openShortcuts())
      if (!mod && key === 'p') return run(() => this.openPreview())

      const slides = this.projectStore.project.slides
      const id = focusedSlideId()
      const index = id ? slides.findIndex((s) => s.id === id) : -1
      if (!mod && (key === 'j' || key === 'k')) {
        const step = key === 'j' ? 1 : -1
        if (event.shiftKey && id) {
          // Move, then keep the moved slide selected.
          return run(() => {
            this.projectStore.moveSlide(id, step > 0 ? index + 2 : index - 1)
            this.$nextTick(() => focusSlide(id))
          })
        }
        return run(() => focusSlide(slides[Math.min(slides.length - 1, Math.max(0, index + step))]?.id))
      }
      if (!id) return
      if (mod && key === 'd') {
        return run(() => {
          this.projectStore.duplicateSlide(id)
          this.$nextTick(() => focusSlide(this.projectStore.project.slides[index + 1]?.id))
        })
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        return run(() => {
          this.projectStore.removeSlide(id)
          this.$nextTick(() => focusSlide(this.projectStore.project.slides[Math.max(0, index - 1)]?.id))
        })
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
        <span class="divider" />
        <button class="btn" @click="openPreview">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></svg>
          Preview
        </button>
        <p class="status" role="status">
          <span v-if="projectStore.status" :key="projectStore.status" class="status-text">{{ projectStore.status }}</span>
        </p>
        <span class="count">{{ projectStore.project.slides.length }} of {{ MAX_SLIDES }} slides</span>
        <IconButton icon="keyboard" label="Keyboard shortcuts (?)" @click="openShortcuts" />
      </div>
      <SlideGrid />
    </main>
    <PhonePreview ref="preview" />
    <ShortcutsDialog ref="shortcuts" />
  </div>
</template>

<style scoped>
.app { display: grid; grid-template-columns: 300px minmax(0, 1fr); min-height: 100vh; }
main { min-width: 0; }
.toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 44px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
}
.divider { width: 1px; height: 18px; margin: 0 6px; background: var(--border-strong); }
.status {
  flex: 1;
  min-width: 0;
  margin: 0 0 0 10px;
  overflow: hidden;
  color: var(--text-2);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.status-text { animation: status-in 0.2s ease-out; }
@keyframes status-in { from { opacity: 0; } }
.count { margin-right: 6px; color: var(--text-3); font-size: 12px; font-variant-numeric: tabular-nums; }

@media (max-width: 760px) {
  .app { grid-template-columns: 1fr; }
  .count { display: none; }
}
</style>
