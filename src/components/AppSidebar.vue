<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useProjectStore } from '../stores/project'

export default defineComponent({
  name: 'AppSidebar',
  computed: {
    ...mapStores(useProjectStore),
    lastFileName(): string {
      return String(this.projectStore.gameCount).padStart(2, '0') + '.jpg'
    },
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
  <aside>
    <h1 class="title">
      <span class="title-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="img" aria-label="Instagram logo">
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="17.2" cy="6.8" r="1.3" fill="currentColor"/>
        </svg>
      </span>
      <span>Instagram Carousel Builder</span>
    </h1>
    <p class="intro">
      Drop a screenshot on each slide, drag it to reposition, then download. Every slide exports as a 1080×1350 JPG.
    </p>

    <label for="handle">Your handle</label>
    <input id="handle" v-model="projectStore.settings.handle" type="text">

    <label for="title">Cover title (one line per row)</label>
    <textarea id="title" v-model="projectStore.settings.title" />

    <label for="shadow">Title shadow colour</label>
    <input id="shadow" v-model="projectStore.settings.shadow" type="color">

    <label for="endTitle">Last slide heading</label>
    <input id="endTitle" v-model="projectStore.settings.endTitle" type="text">

    <label for="endSub">Last slide subline</label>
    <input id="endSub" v-model="projectStore.settings.endSub" type="text">

    <div class="stack">
      <button class="btn" @click="openBulkPicker">Load {{ projectStore.gameCount }} screenshots at once</button>
      <input ref="bulk" type="file" accept="image/*" multiple hidden @change="onBulkChange">
      <p class="hint">
        Files fill slides 2 to {{ projectStore.gameCount + 1 }} in filename order, so name them 01.jpg to
        {{ lastFileName }}. The first one also becomes the cover.
      </p>
      <button class="btn primary" @click="projectStore.downloadAll()">
        Download all {{ projectStore.slides.length }} slides
      </button>
    </div>
  </aside>
</template>

<style scoped>
aside {
  border-right: 1px solid var(--line);
  padding: 24px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: auto;
  background: var(--panel);
}
.title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: Anton, Impact, sans-serif;
  font-weight: 400;
  font-size: 34px;
  line-height: 1.05;
  margin: 0 0 8px;
}
.title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: #111827;
  flex-shrink: 0;
}
.title-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}
.intro { color: var(--muted); margin: 0 0 10px; }
.stack { display: grid; gap: 10px; margin-top: 22px; }

@media (max-width: 760px) {
  aside { position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--line); }
}
</style>
