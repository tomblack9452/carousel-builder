<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { useBrandStore } from '../../stores/brand'
import { useProjectStore } from '../../stores/project'
import type { Corner, Logo } from '../../types'
import SidebarSection from './SidebarSection.vue'

const CORNERS: { value: Corner; label: string }[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
]

export default defineComponent({
  name: 'BrandPanel',
  components: { SidebarSection },
  data() {
    return { CORNERS }
  },
  computed: {
    ...mapStores(useProjectStore, useBrandStore),
    logo(): Logo {
      return this.projectStore.project.logo
    },
  },
  methods: {
    pickLogo() {
      (this.$refs.file as HTMLInputElement).click()
    },
    onFile(event: Event) {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      if (file) this.projectStore.setLogo(file)
      input.value = ''
    },
    setNumber(key: 'size' | 'opacity', event: Event) {
      this.logo[key] = Number((event.target as HTMLInputElement).value)
    },
  },
})
</script>

<template>
  <SidebarSection title="Brand" :default-open="false">
    <p class="field-label">Logo watermark</p>
    <div class="row">
      <button class="btn" @click="pickLogo">{{ logo.asset ? 'Replace logo' : 'Add logo' }}</button>
      <button v-if="logo.asset" class="btn" @click="logo.asset = null">Remove</button>
    </div>
    <input ref="file" type="file" accept="image/*" hidden @change="onFile">
    <p class="hint">A PNG with a transparent background works best.</p>

    <template v-if="logo.asset">
      <label for="logoPosition">Position</label>
      <select id="logoPosition" v-model="logo.position">
        <option v-for="c in CORNERS" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>

      <label for="logoSize">Size <span class="value">{{ Math.round(logo.size * 100) }}%</span></label>
      <input id="logoSize" type="range" min="0.05" max="0.35" step="0.01" :value="logo.size" @input="setNumber('size', $event)">

      <label for="logoOpacity">Opacity <span class="value">{{ Math.round(logo.opacity * 100) }}%</span></label>
      <input
        id="logoOpacity" type="range" min="0.1" max="1" step="0.05"
        :value="logo.opacity" @input="setNumber('opacity', $event)"
      >
    </template>

    <p class="field-label">Brand kit</p>
    <p class="hint">
      Saves your handle, style and logo in this browser. New projects start with it.
    </p>
    <div class="stack">
      <button class="btn" @click="brandStore.saveFromProject()">
        {{ brandStore.kit ? 'Update brand kit from this project' : 'Save as brand kit' }}
      </button>
      <template v-if="brandStore.kit">
        <button class="btn" @click="brandStore.applyToProject()">Apply brand kit to this project</button>
        <button class="btn subtle" @click="brandStore.clear()">Remove brand kit</button>
      </template>
    </div>
  </SidebarSection>
</template>

<style scoped>
select, input[type=range] { width: 100%; }
.value { float: right; font-weight: 400; color: var(--muted); }
.stack { display: grid; gap: 8px; margin-top: 8px; }
.subtle { color: var(--muted); }
</style>
