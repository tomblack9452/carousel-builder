<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { renderSlide } from '../render'
import { useAssetStore } from '../stores/assets'
import { useProjectStore } from '../stores/project'

/** How many placeholder posts sit around yours in the profile grid view. */
const GRID_FILLERS = 5

export default defineComponent({
  name: 'PhonePreview',
  data() {
    return {
      tab: 'feed' as 'feed' | 'grid',
      images: [] as string[],
      current: 0,
      expanded: false,
      GRID_FILLERS,
    }
  },
  computed: {
    ...mapStores(useProjectStore, useAssetStore),
    handle(): string {
      return this.projectStore.project.handle.replace(/^@/, '') || 'yourhandle'
    },
    avatar(): string | null {
      const id = this.projectStore.project.logo.asset
      return id ? this.assetsStore.images[id]?.src ?? null : null
    },
    ratio(): string {
      return `${this.projectStore.doc.width} / ${this.projectStore.doc.height}`
    },
    caption(): string {
      return this.projectStore.project.caption.trim()
    },
  },
  watch: {
    // The feed track is rebuilt at slide 1 when you come back to it.
    tab() {
      this.current = 0
    },
  },
  methods: {
    async open() {
      await this.projectStore.ensureFonts()
      this.images = this.renderAll()
      this.current = 0
      this.expanded = false
      ;(this.$refs.dialog as HTMLDialogElement).showModal()
      // The track keeps its scroll position between openings; start back at slide 1.
      const track = this.$refs.track as HTMLElement | undefined
      if (track) track.scrollLeft = 0
    },
    close() {
      (this.$refs.dialog as HTMLDialogElement).close()
    },
    renderAll(): string[] {
      const doc = this.projectStore.doc
      const canvas = document.createElement('canvas')
      canvas.width = doc.width
      canvas.height = doc.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return []
      return doc.project.slides.map((slide) => {
        renderSlide(ctx, slide, doc)
        return canvas.toDataURL('image/jpeg', 0.85)
      })
    },
    onScroll(event: Event) {
      const el = event.target as HTMLElement
      this.current = Math.round(el.scrollLeft / el.clientWidth)
    },
    go(step: number) {
      const el = this.$refs.track as HTMLElement
      el.scrollTo({ left: (this.current + step) * el.clientWidth, behavior: 'smooth' })
    },
    onBackdrop(event: MouseEvent) {
      if (event.target === this.$refs.dialog) this.close()
    },
  },
})
</script>

<template>
  <dialog ref="dialog" class="preview" aria-label="Phone preview" @click="onBackdrop">
    <div class="shell">
      <div class="bar">
        <div class="segmented tabs" role="tablist">
          <button role="tab" :aria-selected="tab === 'feed'" :aria-pressed="tab === 'feed'" @click="tab = 'feed'">Feed post</button>
          <button role="tab" :aria-selected="tab === 'grid'" :aria-pressed="tab === 'grid'" @click="tab = 'grid'">Profile grid</button>
        </div>
        <button class="close" aria-label="Close preview" @click="close">
          <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" /></svg>
        </button>
      </div>

      <div class="phone">
        <template v-if="tab === 'feed'">
          <header class="post-head">
            <span class="avatar">
              <img v-if="avatar" :src="avatar" alt="">
              <span v-else>{{ handle.charAt(0).toUpperCase() }}</span>
            </span>
            <strong>{{ handle }}</strong>
          </header>
          <div class="media" :style="{ aspectRatio: ratio }">
            <div ref="track" class="track" @scroll.passive="onScroll">
              <img v-for="(src, i) in images" :key="i" :src="src" :alt="`Slide ${i + 1}`">
            </div>
            <span class="counter">{{ current + 1 }}/{{ images.length }}</span>
            <button v-if="current > 0" class="nav prev" aria-label="Previous slide" @click="go(-1)">‹</button>
            <button v-if="current < images.length - 1" class="nav next" aria-label="Next slide" @click="go(1)">›</button>
          </div>
          <div class="actions" aria-hidden="true">
            <span class="icons">
              <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
              <svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-3.2-6.4A8 8 0 0 1 20 12zM20 12l1 7-5-2" /></svg>
              <svg viewBox="0 0 24 24"><path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" /></svg>
            </span>
            <span class="dots">
              <i v-for="(_, i) in images" :key="i" :class="{ on: i === current }" />
            </span>
            <svg class="save" viewBox="0 0 24 24"><path d="M6 3h12v18l-6-5-6 5z" /></svg>
          </div>
          <p v-if="caption" class="caption" :class="{ clamp: !expanded }">
            <strong>{{ handle }}</strong> {{ caption }}
          </p>
          <button v-if="caption && !expanded" class="more" @click="expanded = true">more</button>
        </template>

        <template v-else>
          <header class="grid-head"><strong>{{ handle }}</strong></header>
          <div class="grid">
            <img class="tile" :src="images[0]" alt="Your cover in the grid">
            <span v-for="n in GRID_FILLERS" :key="n" class="tile filler" />
          </div>
          <p class="note">Profile grids show posts as 3:4 tiles, so the cover's edges may be cropped.</p>
        </template>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.preview {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  max-height: 100vh;
  overflow: visible;
}
.preview::backdrop { background: var(--backdrop); }
.shell { display: grid; gap: 10px; padding: 12px; }
.bar { display: flex; gap: 8px; }
.tabs { flex: 1; background: var(--panel); box-shadow: var(--shadow-pop); }
.tabs button[aria-pressed="true"] { background: var(--field); box-shadow: none; }
.close {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: var(--radius);
  background: var(--panel);
  color: var(--text);
  box-shadow: var(--shadow-pop);
  cursor: pointer;
}
.close:hover { background: var(--field); }
.close svg { width: 11px; height: 11px; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }

/* The phone mimics Instagram's own dark UI, so it keeps fixed colours. */
.phone {
  width: min(375px, calc(100vw - 24px));
  max-height: calc(100vh - 90px);
  overflow: auto;
  background: #000;
  color: #f5f5f5;
  border-radius: 34px;
  border: 9px solid #1a1a1a;
  box-shadow: 0 0 0 1px #3a3a3a, var(--shadow-pop);
  font: 14px/1.35 -apple-system, "Segoe UI", system-ui, sans-serif;
  scrollbar-width: none;
}
.post-head, .grid-head { display: flex; align-items: center; gap: 10px; padding: 12px 12px 10px; font-size: 13px; }
.avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #262626;
  box-shadow: 0 0 0 1.5px #000, 0 0 0 3px #d62976;
  font-weight: 700;
}
.avatar img { width: 100%; height: 100%; object-fit: contain; background: #fff; }

.media { position: relative; background: #111; }
.track {
  display: flex;
  height: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.track img { flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; scroll-snap-align: start; }
.counter {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(18, 18, 18, 0.7);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.nav {
  position: absolute;
  top: 50%;
  translate: 0 -50%;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.82);
  color: #000;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.prev { left: 10px; }
.next { right: 10px; }

.actions { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 10px 12px 6px; }
.actions svg { width: 24px; height: 24px; fill: none; stroke: #f5f5f5; stroke-width: 1.8; stroke-linejoin: round; stroke-linecap: round; }
.icons { display: flex; gap: 14px; }
.save { justify-self: end; }
.dots { display: flex; gap: 4px; }
.dots i { width: 6px; height: 6px; border-radius: 50%; background: #555; transition: background-color 0.15s; }
.dots i.on { background: #0095f6; }
.caption { margin: 4px 12px 0; white-space: pre-wrap; word-break: break-word; }
.caption.clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.more { margin: 0 12px 14px; padding: 0; border: 0; background: none; color: #a8a8a8; font: inherit; cursor: pointer; }

.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
.tile { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; display: block; }
.filler { background: #262626; }
.note { margin: 12px 12px 16px; color: #a8a8a8; font-size: 12px; }
</style>
