<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useAiStore } from '../../stores/ai'
import SidebarSection from './SidebarSection.vue'

export default defineComponent({
  name: 'AiPanel',
  components: { SidebarSection },
  data() {
    return { key: '' }
  },
  computed: {
    ...mapStores(useAiStore),
  },
  methods: {
    save() {
      if (!this.key.trim()) return
      this.aiStore.saveKey(this.key)
      this.key = ''
    },
  },
})
</script>

<template>
  <SidebarSection title="AI suggestions" :default-open="false">
    <template v-if="aiStore.hasKey">
      <p class="hint on">AI suggestions are on. Look for the Suggest buttons on slides, alt text and the caption.</p>
      <button class="btn wide" @click="aiStore.removeKey()">Remove my API key</button>
    </template>
    <template v-else>
      <label for="apiKey">Anthropic API key</label>
      <input id="apiKey" v-model="key" type="password" autocomplete="off" placeholder="sk-ant-..." @keydown.enter="save">
      <button class="btn wide" :disabled="!key.trim()" @click="save">Turn on AI suggestions</button>
    </template>
    <p class="hint">
      Uses Claude to suggest titles, captions and alt text. Your key is stored only in this browser and sent only
      to Anthropic. Each suggestion is a small request billed to your Anthropic account.
    </p>
  </SidebarSection>
</template>

<style scoped>
.wide { width: 100%; margin-top: 8px; }
.on { display: flex; gap: 8px; align-items: baseline; margin-top: 0; color: var(--text); }
.on::before { content: ''; flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--success); transform: translateY(-1px); }
</style>
