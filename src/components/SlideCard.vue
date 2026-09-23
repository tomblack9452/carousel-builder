<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { mapStores } from 'pinia'
import { LOW_RES_SCALE, SLIDE_DRAG_TYPE } from '../constants'
import { SLIDE_TYPE_ORDER, SLIDE_TYPES, type SlideTypeInfo } from '../model/slideTypes'
import { slotFrames } from '../render'
import { fitImage } from '../render/geometry'
import { useAssetStore } from '../stores/assets'
import { useProjectStore } from '../stores/project'
import type { Align, Anchor, ImageSlot, Slide, SlideType } from '../types'
import IconButton, { type IconName } from './IconButton.vue'
import SlideAdjustments from './SlideAdjustments.vue'
import SlideCanvas from './SlideCanvas.vue'

const ALIGNS: { value: Align; icon: IconName; label: string }[] = [
  { value: 'left', icon: 'alignLeft', label: 'left' },
  { value: 'center', icon: 'alignCenter', label: 'centre' },
  { value: 'right', icon: 'alignRight', label: 'right' },
]
const ANCHORS: { value: Anchor }[] = [{ value: 'top' }, { value: 'middle' }, { value: 'bottom' }]

export default defineComponent({
  name: 'SlideCard',
  components: { IconButton, SlideAdjustments, SlideCanvas },
  props: {
    slide: { type: Object as PropType<Slide>, required: true },
    index: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  data() {
    return {
      ALIGNS,
      ANCHORS,
      dragOver: false,
      /** Where a slide being dragged onto this card would land. */
      dropSide: null as 'before' | 'after' | null,
      /** Which image slot the hidden file input is choosing for. */
      pickingSlot: 0,
    }
  },
  computed: {
    ...mapStores(useProjectStore, useAssetStore),
    info(): SlideTypeInfo {
      return SLIDE_TYPES[this.slide.type]
    },
    typeOptions(): { value: SlideType; label: string }[] {
      return SLIDE_TYPE_ORDER.map((value) => ({ value, label: SLIDE_TYPES[value].label }))
    },
    /** The image slots this slide type actually uses. */
    slots(): ImageSlot[] {
      return this.slide.images.slice(0, this.info.imageSlots)
    },
    takesImage(): boolean {
      return this.slots.length > 0
    },
    lowResWarning(): string {
      const { width, height } = this.projectStore.doc
      const frames = slotFrames(this.slide, width, height)
      for (const [i, slot] of this.slots.entries()) {
        const img = slot.asset ? this.assetsStore.images[slot.asset] : undefined
        if (img && fitImage(img, slot.zoom, frames[i].w, frames[i].h).scale > LOW_RES_SCALE) {
          return `Low resolution (${img.naturalWidth}×${img.naturalHeight}px). It will look soft when posted.`
        }
      }
      return ''
    },
  },
  methods: {
    pickFile(slot: number) {
      this.pickingSlot = slot
      ;(this.$refs.file as HTMLInputElement).click()
    },
    onFileChange(event: Event) {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      if (file) this.projectStore.setImage(this.slide.id, this.pickingSlot, file)
      input.value = ''
    },
    onGripDragStart(event: DragEvent) {
      if (!event.dataTransfer) return
      event.dataTransfer.setData(SLIDE_DRAG_TYPE, this.slide.id)
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setDragImage(this.$el as HTMLElement, 40, 40)
    },
    onDragOver(event: DragEvent) {
      const types = event.dataTransfer?.types ?? []
      if (types.includes(SLIDE_DRAG_TYPE)) {
        event.preventDefault()
        const rect = (this.$el as HTMLElement).getBoundingClientRect()
        this.dropSide = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
      } else if (types.includes('Files') && this.takesImage) {
        event.preventDefault()
        this.dragOver = true
      }
    },
    onDragLeave() {
      this.dragOver = false
      this.dropSide = null
    },
    onDrop(event: DragEvent) {
      const movedId = event.dataTransfer?.getData(SLIDE_DRAG_TYPE)
      if (movedId) {
        event.preventDefault()
        const target = this.index + (this.dropSide === 'after' ? 1 : 0)
        this.onDragLeave()
        if (movedId !== this.slide.id) this.projectStore.moveSlide(movedId, target)
        return
      }
      if (!this.takesImage) return
      event.preventDefault()
      this.dragOver = false
      const file = [...(event.dataTransfer?.files ?? [])].find((f) => f.type.startsWith('image/'))
      if (!file) {
        this.projectStore.status = 'That drop had no image file in it. Drag the saved image file from your folder.'
        return
      }
      // Fill the first empty slot, else replace the first.
      const empty = this.slots.findIndex((s) => !s.asset)
      this.projectStore.setImage(this.slide.id, Math.max(0, empty), file)
    },
    onType(event: Event) {
      this.projectStore.changeType(this.slide.id, (event.target as HTMLSelectElement).value as SlideType)
    },
    onText(field: 'title' | 'body', event: Event) {
      this.projectStore.updateSlide(this.slide.id, { [field]: (event.target as HTMLInputElement).value })
    },
    onZoom(slot: number, event: Event) {
      this.projectStore.updateSlot(this.slide.id, slot, { zoom: Number((event.target as HTMLInputElement).value) })
    },
  },
})
</script>

<template>
  <div
    class="card"
    :class="{ over: dragOver, 'drop-before': dropSide === 'before', 'drop-after': dropSide === 'after' }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <SlideCanvas :slide="slide" :index="index" @pick="pickFile" />

    <div class="meta">
      <span
        class="grip"
        draggable="true"
        title="Drag to reorder"
        @dragstart="onGripDragStart"
        @dragend="onDragLeave"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></svg>
        Slide {{ index + 1 }} of {{ total }}
      </span>
      <select :value="slide.type" :aria-label="`Slide ${index + 1} type`" @change="onType">
        <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>
    <p class="warn">{{ lowResWarning }}</p>

    <template v-for="field in (['title', 'body'] as const)" :key="field">
      <template v-if="info[field]">
        <textarea
          v-if="info[field]?.multiline"
          :value="slide[field]"
          :placeholder="info[field]?.placeholder"
          :aria-label="`Slide ${index + 1} ${info[field]?.label}`"
          rows="3"
          @input="onText(field, $event)"
        />
        <input
          v-else
          type="text"
          :value="slide[field]"
          :placeholder="info[field]?.placeholder"
          :aria-label="`Slide ${index + 1} ${info[field]?.label}`"
          @input="onText(field, $event)"
        >
      </template>
    </template>

    <div class="row text-pos" role="group" :aria-label="`Slide ${index + 1} text position`">
      <IconButton
        v-for="a in ALIGNS"
        :key="a.value"
        :icon="a.icon"
        :label="`Align text ${a.label}`"
        :active="slide.text.align === a.value"
        @click="projectStore.setTextAlign(slide.id, a.value)"
      />
      <span class="sep" />
      <IconButton
        v-for="a in ANCHORS"
        :key="a.value"
        :icon="a.value"
        :label="`Move text to the ${a.value}`"
        :active="slide.text.anchor === a.value"
        @click="projectStore.snapText(slide.id, a.value)"
      />
    </div>

    <template v-if="takesImage">
      <input ref="file" type="file" accept="image/*" hidden @change="onFileChange">
      <div v-for="(slot, i) in slots" :key="i" class="row">
        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          :value="slot.zoom"
          :disabled="!slot.asset"
          :aria-label="`Slide ${index + 1} image ${i + 1} zoom`"
          @input="onZoom(i, $event)"
        >
        <button class="btn" @click="pickFile(i)">
          {{ slot.asset ? 'Replace' : 'Add' }} image{{ slots.length > 1 ? ` ${i + 1}` : '' }}
        </button>
      </div>
      <p v-if="info.imageHint" class="hint">{{ info.imageHint }}</p>
      <SlideAdjustments v-if="slots.some((s) => s.asset) || slide.type === 'cta'" :slide="slide" :index="index" />
    </template>

    <div class="row actions">
      <IconButton
        icon="left"
        :label="`Move slide ${index + 1} earlier`"
        :disabled="index === 0"
        @click="projectStore.moveSlide(slide.id, index - 1)"
      />
      <IconButton
        icon="right"
        :label="`Move slide ${index + 1} later`"
        :disabled="index === total - 1"
        @click="projectStore.moveSlide(slide.id, index + 2)"
      />
      <IconButton
        icon="copy"
        :label="`Duplicate slide ${index + 1}`"
        :disabled="!projectStore.canAdd"
        @click="projectStore.duplicateSlide(slide.id)"
      />
      <IconButton
        icon="trash"
        :label="`Delete slide ${index + 1}`"
        :disabled="total <= 1"
        @click="projectStore.removeSlide(slide.id)"
      />
      <button class="btn" @click="projectStore.downloadSlide(slide.id)">Download</button>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px;
}
.card { position: relative; }
.card.over { border-color: var(--amber); }
/* Insertion marker when reordering. */
.card.drop-before::before, .card.drop-after::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 2px;
  background: var(--amber);
}
.card.drop-before::before { left: -13px; }
.card.drop-after::after { right: -13px; }

.grip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: grab;
  user-select: none;
}
.grip svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--muted);
  stroke-width: 3;
  stroke-linecap: round;
}
.actions { margin-top: 10px; }
.text-pos { gap: 4px; margin: 0 0 6px; }
.text-pos .sep { width: 1px; align-self: stretch; margin: 4px 4px; background: var(--line); }
.card input[type=text], .card textarea { margin-bottom: 6px; }
.card textarea { min-height: 0; }

.meta {
  display: flex;
  justify-content: space-between;
  margin: 10px 0 4px;
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 600;
  font-size: 17px;
}
.meta { align-items: center; gap: 8px; }
.meta select { font: 600 15px Barlow, sans-serif; }

.warn { color: var(--amber); font-size: 13px; min-height: 1.2em; margin: 0 0 6px; }
</style>
