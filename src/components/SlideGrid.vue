<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useProjectStore } from '../stores/project'
import SlideCard from './SlideCard.vue'

export default defineComponent({
  name: 'SlideGrid',
  components: { SlideCard },
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
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 22px;
}
</style>
