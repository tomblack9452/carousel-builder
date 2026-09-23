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
        <button class="btn preview-btn" @click="openPreview">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2" /></svg>
          Preview
        </button>
        <button class="btn keys-btn" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts" @click="openShortcuts">?</button>
        <p class="status" role="status">{{ projectStore.status }}</p>
      </div>
      <SlideGrid />
    </main>
    <PhonePreview ref="preview" />
    <ShortcutsDialog ref="shortcuts" />
  </div>
</template>

<style scoped>
.app { display: grid; grid-template-columns: 300px 1fr; min-height: 100vh; }
main { padding: 24px; }
.toolbar { display: flex; align-items: center; gap: 8px; margin: 0 0 16px; }
.status { color: var(--amber); margin: 0 0 0 8px; }
.preview-btn { gap: 6px; padding: 6px 12px; }
.keys-btn { width: 32px; height: 32px; padding: 0; font-size: 16px; }
.preview-btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }

@media (max-width: 760px) {
  .app { grid-template-columns: 1fr; }
}
</style>
