<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useProjectStore } from '../stores/project'
import AiPanel from './sidebar/AiPanel.vue'
import BrandPanel from './sidebar/BrandPanel.vue'
import CaptionPanel from './sidebar/CaptionPanel.vue'
import ExportPanel from './sidebar/ExportPanel.vue'
import ProjectPanel from './sidebar/ProjectPanel.vue'
import StylePanel from './sidebar/StylePanel.vue'
import TemplatesPanel from './sidebar/TemplatesPanel.vue'

export default defineComponent({
  name: 'AppSidebar',
  components: { AiPanel, BrandPanel, CaptionPanel, ExportPanel, ProjectPanel, StylePanel, TemplatesPanel },
  computed: {
    ...mapStores(useProjectStore),
  },
})
</script>

<template>
  <aside>
    <header class="brand">
      <svg class="mark" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9" y="3" width="11" height="14" rx="2" class="back" />
        <rect x="4" y="7" width="11" height="14" rx="2" class="front" />
      </svg>
      <h1>Carousel Builder</h1>
    </header>
    <p class="intro">
      Drop an image on each slide and drag it to reposition. Slides export at
      {{ projectStore.doc.width }}×{{ projectStore.doc.height }} {{ projectStore.project.export.format.toUpperCase() }}.
    </p>

    <ProjectPanel />
    <TemplatesPanel />
    <StylePanel />
    <BrandPanel />
    <CaptionPanel />
    <AiPanel />
    <ExportPanel />
  </aside>
</template>

<style scoped>
aside {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: auto;
  padding-bottom: 32px;
  border-right: 1px solid var(--border);
  background: var(--panel);
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong) transparent;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
}
.mark { width: 20px; height: 20px; flex: none; }
.mark .back { fill: var(--text-3); }
.mark .front { fill: var(--accent); stroke: var(--panel); stroke-width: 1.5; }
h1 { margin: 0; font-size: 13px; font-weight: 600; }
.intro { margin: 0; padding: 12px 16px 14px; font-size: 12px; color: var(--text-3); }

@media (max-width: 760px) {
  aside { position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--border); }
}
</style>
