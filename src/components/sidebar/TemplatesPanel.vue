<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useTemplateStore } from '../../stores/templates'
import IconButton from '../IconButton.vue'
import SidebarSection from './SidebarSection.vue'

export default defineComponent({
  name: 'TemplatesPanel',
  components: { IconButton, SidebarSection },
  computed: {
    ...mapStores(useTemplateStore),
  },
  methods: {
    use(id: string, name: string) {
      if (window.confirm(`Start from "${name}"? Your current slides will be replaced (you can undo).`)) {
        this.templatesStore.use(id)
      }
    },
    save() {
      const name = window.prompt('Name this template', 'My template')?.trim()
      if (name) this.templatesStore.saveCurrent(name)
    },
    remove(id: string, name: string) {
      if (window.confirm(`Delete the "${name}" template?`)) this.templatesStore.remove(id)
    },
  },
})
</script>

<template>
  <SidebarSection title="Templates" :default-open="false">
    <ul class="list">
      <li v-for="t in templatesStore.all" :key="t.id">
        <span class="name">{{ t.name }}<small v-if="t.builtIn"> · starter</small></span>
        <button class="btn" @click="use(t.id, t.name)">Use</button>
        <IconButton v-if="!t.builtIn" icon="trash" :label="`Delete ${t.name}`" @click="remove(t.id, t.name)" />
      </li>
    </ul>
    <button class="btn wide" @click="save">Save this project as a template</button>
    <p class="hint">Templates keep layout, style and text. Images aren't included.</p>
  </SidebarSection>
</template>

<style scoped>
.list { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 6px; }
.list li { display: flex; align-items: center; gap: 6px; }
.name { flex: 1; font-weight: 600; }
.name small { color: var(--muted); font-weight: 400; }
.list .btn { padding: 5px 12px; }
.wide { width: 100%; margin-top: 10px; }
</style>
