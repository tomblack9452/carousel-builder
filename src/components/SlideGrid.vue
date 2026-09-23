<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useProjectStore } from '../stores/project'
import AddSlideCard from './AddSlideCard.vue'
import SlideCard from './SlideCard.vue'

export default defineComponent({
  name: 'SlideGrid',
  components: { AddSlideCard, SlideCard },
  computed: {
    ...mapStores(useProjectStore),
  },
})
</script>

<template>
  <div class="grid">
    <SlideCard
      v-for="(slide, index) in projectStore.project.slides"
      :key="slide.id"
      :slide="slide"
      :index="index"
      :total="projectStore.project.slides.length"
    />
    <AddSlideCard />
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  align-items: stretch;
  padding: 16px 16px 48px;
}
@media (max-width: 760px) {
  .grid { padding: 12px; gap: 12px; }
}
</style>
