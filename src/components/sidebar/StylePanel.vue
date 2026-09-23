<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useProjectStore } from '../../stores/project'
import SidebarSection from './SidebarSection.vue'

export default defineComponent({
  name: 'StylePanel',
  components: { SidebarSection },
  computed: {
    ...mapStores(useProjectStore),
  },
})
</script>

<template>
  <SidebarSection title="Style">
    <label for="handle">Your handle</label>
    <input id="handle" v-model="projectStore.project.handle" type="text">

    <label for="accent">Title shadow colour</label>
    <input id="accent" v-model="projectStore.project.accent" type="color">
  </SidebarSection>
</template>
