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
        <span class="name">{{ t.name }}</span>
        <small v-if="t.builtIn" class="tag">Starter</small>
        <IconButton v-else icon="trash" :label="`Delete ${t.name}`" @click="remove(t.id, t.name)" />
        <button class="btn use" @click="use(t.id, t.name)">Use</button>
      </li>
    </ul>
    <button class="btn wide" @click="save">Save this project as a template</button>
    <p class="hint">Templates keep layout, style and text. Images aren't included.</p>
  </SidebarSection>
</template>

<style scoped>
.list { list-style: none; margin: 0 -8px; padding: 0; }
.list li { display: flex; align-items: center; gap: 6px; min-height: 34px; padding: 0 8px; border-radius: var(--radius); }
.list li:hover { background: var(--hover); }
.name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tag { font-size: 11px; color: var(--text-3); }
.use { height: 24px; padding: 0 10px; font-size: 12px; }
.wide { width: 100%; margin-top: 10px; }
</style>
