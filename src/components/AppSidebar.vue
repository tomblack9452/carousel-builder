<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useProjectStore } from '../stores/project'

export default defineComponent({
  name: 'AppSidebar',
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
  <aside>
    <h1 class="title">
      <svg class="title-icon" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="ig-gradient" gradientUnits="userSpaceOnUse" x1="19" y1="1" x2="5" y2="23">
            <stop offset="0" stop-color="#7638fa" />
            <stop offset="0.3" stop-color="#d300c5" />
            <stop offset="0.55" stop-color="#ff0069" />
            <stop offset="0.8" stop-color="#ff7a00" />
            <stop offset="1" stop-color="#ffd600" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#ig-gradient)" stroke-width="2.3">
          <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="5.6" />
          <circle cx="12" cy="12" r="4.5" />
        </g>
        <circle cx="17.3" cy="6.7" r="1.4" fill="url(#ig-gradient)" />
      </svg>Instagram Carousel Builder
    </h1>
    <p class="intro">
      Drop an image on each slide, drag it to reposition, then download. Every slide exports as a 1080×1350 JPG.
    </p>

    <label for="handle">Your handle</label>
    <input id="handle" v-model="projectStore.project.handle" type="text">

    <label for="accent">Title shadow colour</label>
    <input id="accent" v-model="projectStore.project.accent" type="color">

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
  font-family: Anton, Impact, sans-serif;
  font-weight: 400;
  font-size: 34px;
  line-height: 1.05;
  margin: 0 0 8px;
}
/* Sits in the first text line at the full line height. */
.title-icon {
  display: inline-block;
  width: 1.05em;
  height: 1.05em;
  vertical-align: top;
  margin-right: 0.22em;
}
.intro { color: var(--muted); margin: 0 0 10px; }
.stack { display: grid; gap: 10px; margin-top: 22px; }

@media (max-width: 760px) {
  aside { position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--line); }
}
</style>
