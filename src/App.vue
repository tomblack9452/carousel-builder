<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useProjectStore } from './stores/project'
import AppSidebar from './components/AppSidebar.vue'
import SlideGrid from './components/SlideGrid.vue'

export default defineComponent({
  name: 'App',
  components: { AppSidebar, SlideGrid },
  computed: {
    ...mapStores(useProjectStore),
  },
  mounted() {
    // Canvas text only uses a web font once it's loaded, so redraw when they arrive.
    Promise.all([document.fonts.load('40px Anton'), document.fonts.load('600 40px "Barlow Condensed"')])
      .catch(() => {})
      .finally(() => {
        this.projectStore.fontsReady = true
      })
  },
})
</script>

<template>
  <div class="app">
    <AppSidebar />
    <main>
      <p class="status" role="status">{{ projectStore.status }}</p>
      <SlideGrid />
    </main>
  </div>
</template>

<style scoped>
.app { display: grid; grid-template-columns: 300px 1fr; min-height: 100vh; }
main { padding: 24px; }
.status { color: var(--amber); margin: 0 0 16px; min-height: 1.4em; }

@media (max-width: 760px) {
  .app { grid-template-columns: 1fr; }
}
</style>
