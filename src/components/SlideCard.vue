<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { mapStores } from 'pinia'
import { LOW_RES_SCALE } from '../constants'
import { fitImage } from '../render/geometry'
import { useProjectStore } from '../stores/project'
import type { Slide } from '../types'
import SlideCanvas from './SlideCanvas.vue'

const TYPE_LABELS: Record<Slide['type'], string> = { cover: 'Cover', game: '', end: 'Question' }

export default defineComponent({
  name: 'SlideCard',
  components: { SlideCanvas },
  props: {
    slide: { type: Object as PropType<Slide>, required: true },
    index: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  data() {
    return { dragOver: false }
  },
  computed: {
    ...mapStores(useProjectStore),
    takesImage(): boolean {
      return this.slide.type !== 'end'
    },
    typeLabel(): string {
      return TYPE_LABELS[this.slide.type]
    },
    lowResWarning(): string {
      const img = this.slide.img
      if (!img || fitImage(img, this.slide.zoom).scale <= LOW_RES_SCALE) return ''
      return `Low resolution (${img.naturalWidth}×${img.naturalHeight}px). It will look soft when posted.`
    },
  },
  methods: {
    pickFile() {
      (this.$refs.file as HTMLInputElement).click()
    },
    onFileChange(event: Event) {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      if (file) this.projectStore.loadImage(this.index, file)
      input.value = ''
    },
    onDragOver(event: DragEvent) {
      if (!this.takesImage) return
      event.preventDefault()
      this.dragOver = true
    },
    onDrop(event: DragEvent) {
      if (!this.takesImage) return
      event.preventDefault()
      this.dragOver = false
      const file = [...(event.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/'))
      if (file) this.projectStore.loadImage(this.index, file)
      else this.projectStore.status = 'That drop had no image file in it. Drag the saved image file from your folder.'
    },
    onTextInput(field: 'name' | 'meta', event: Event) {
      this.projectStore.updateSlide(this.index, { [field]: (event.target as HTMLInputElement).value })
    },
    onZoom(event: Event) {
      this.projectStore.updateSlide(this.index, { zoom: Number((event.target as HTMLInputElement).value) })
    },
  },
})
</script>

<template>
  <div
    class="card"
    :class="{ over: dragOver }"
    @dragover="onDragOver"
    @dragleave="dragOver = false"
    @drop="onDrop"
  >
    <SlideCanvas :slide="slide" :index="index" :interactive="takesImage" @pick="pickFile" />

    <div class="meta">
      <span>Slide {{ index + 1 }} of {{ total }}</span>
      <span>{{ typeLabel }}</span>
    </div>
    <p class="warn">{{ lowResWarning }}</p>

    <template v-if="slide.type === 'game'">
      <input
        type="text"
        placeholder="Game name"
        :value="slide.name"
        :aria-label="`Slide ${index + 1} game name`"
        @input="onTextInput('name', $event)"
      >
      <input
        type="text"
        placeholder="Console, year"
        :value="slide.meta"
        :aria-label="`Slide ${index + 1} console and year`"
        @input="onTextInput('meta', $event)"
      >
    </template>

    <template v-if="takesImage">
      <input ref="file" type="file" accept="image/*" hidden @change="onFileChange">
      <div class="row">
        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          :value="slide.zoom"
          :aria-label="`Slide ${index + 1} zoom`"
          @input="onZoom"
        >
      </div>
      <div class="row">
        <button class="btn" @click="pickFile">Replace image</button>
        <button class="btn" @click="projectStore.downloadSlide(index)">Download</button>
      </div>
    </template>
    <template v-else>
      <p class="hint">Background uses the cover image, blurred.</p>
      <div class="row">
        <button class="btn" @click="projectStore.downloadSlide(index)">Download</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px;
}
.card.over { border-color: var(--amber); }
.card input[type=text] { margin-bottom: 6px; }

.meta {
  display: flex;
  justify-content: space-between;
  margin: 10px 0 4px;
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 600;
  font-size: 17px;
}
.meta span + span { color: var(--muted); }

.warn { color: var(--amber); font-size: 13px; min-height: 1.2em; margin: 0 0 6px; }
</style>
