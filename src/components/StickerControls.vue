<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { mapStores } from 'pinia'
import { EMOJI, SHAPES } from '../model/stickers'
import { useProjectStore } from '../stores/project'
import type { Slide, Sticker, StickerKind } from '../types'

export default defineComponent({
  name: 'StickerControls',
  props: {
    slide: { type: Object as PropType<Slide>, required: true },
    index: { type: Number, required: true },
    /** Id of the selected sticker, or null. */
    selected: { type: String as PropType<string | null>, default: null },
  },
  emits: {
    select: (id: string | null) => id === null || typeof id === 'string',
  },
  data() {
    return { EMOJI, SHAPES }
  },
  computed: {
    ...mapStores(useProjectStore),
    sticker(): Sticker | undefined {
      return this.slide.stickers.find((s) => s.id === this.selected)
    },
  },
  methods: {
    onAdd(event: Event) {
      const select = event.target as HTMLSelectElement
      const [kind, emoji = ''] = select.value.split(':')
      select.value = ''
      if (!kind) return
      this.$emit('select', this.projectStore.addSticker(this.slide.id, kind as StickerKind, emoji))
    },
    update(key: 'size' | 'rotation', event: Event) {
      if (!this.sticker) return
      this.projectStore.updateSticker(this.slide.id, this.sticker.id, { [key]: Number((event.target as HTMLInputElement).value) })
    },
    setColour(event: Event) {
      if (!this.sticker) return
      this.projectStore.updateSticker(this.slide.id, this.sticker.id, { color: (event.target as HTMLInputElement).value })
    },
    remove() {
      if (!this.sticker) return
      this.projectStore.removeSticker(this.slide.id, this.sticker.id)
      this.$emit('select', null)
    },
  },
})
</script>

<template>
  <div class="stickers">
    <select :aria-label="`Add a sticker to slide ${index + 1}`" value="" @change="onAdd">
      <option value="" disabled>Add a sticker…</option>
      <optgroup label="Shapes">
        <option v-for="s in SHAPES" :key="s.kind" :value="s.kind">{{ s.label }}</option>
      </optgroup>
      <optgroup label="Emoji">
        <option v-for="e in EMOJI" :key="e" :value="`emoji:${e}`">{{ e }}</option>
      </optgroup>
    </select>

    <div v-if="sticker" class="edit">
      <label>
        <span>Size</span>
        <input type="range" min="0.05" max="0.8" step="0.01" :value="sticker.size" @input="update('size', $event)">
      </label>
      <label>
        <span>Turn</span>
        <input type="range" min="-180" max="180" step="1" :value="sticker.rotation" @input="update('rotation', $event)">
      </label>
      <div class="row">
        <input v-if="sticker.kind !== 'emoji'" type="color" :value="sticker.color" aria-label="Sticker colour" @input="setColour">
        <button class="btn" @click="remove">Remove sticker</button>
        <button class="btn" @click="$emit('select', null)">Done</button>
      </div>
      <p class="hint">Drag it on the slide to move it.</p>
    </div>
  </div>
</template>

<style scoped>
.stickers { margin-top: 8px; }
select { width: 100%; }
.edit { margin-top: 8px; padding: 10px; border-radius: var(--radius); background: var(--panel-sunken); box-shadow: inset 0 0 0 1px var(--accent); }
.edit label { display: grid; grid-template-columns: 36px minmax(0, 1fr); align-items: center; gap: 8px; margin: 2px 0; font-size: 12px; color: var(--text-2); }
.edit input[type=range] { width: 100%; }
.edit .row { margin-top: 8px; }
.edit .btn { height: 26px; font-size: 12px; }
.edit .hint { font-size: 11px; }
</style>
