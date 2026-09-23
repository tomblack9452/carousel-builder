<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { mapStores } from 'pinia'
import { describeError, suggestAltText, suggestTitles } from '../ai/claude'
import { LOW_RES_SCALE, SLIDE_DRAG_TYPE } from '../constants'
import { slideThumbnailBase64 } from '../export/files'
import { useAiStore } from '../stores/ai'
import { SLIDE_TYPE_ORDER, SLIDE_TYPES, type SlideTypeInfo } from '../model/slideTypes'
import { slotFrames } from '../render'
import { fitImage, mediaSize } from '../render/geometry'
import { useAssetStore } from '../stores/assets'
import { useProjectStore } from '../stores/project'
import type { Align, Anchor, ImageSlot, Slide, SlideType } from '../types'
import IconButton, { type IconName } from './IconButton.vue'
import SlideAdjustments from './SlideAdjustments.vue'
import SlideCanvas from './SlideCanvas.vue'
import StickerControls from './StickerControls.vue'

const ALIGNS: { value: Align; icon: IconName; label: string }[] = [
  { value: 'left', icon: 'alignLeft', label: 'left' },
  { value: 'center', icon: 'alignCenter', label: 'centre' },
  { value: 'right', icon: 'alignRight', label: 'right' },
]
const ANCHORS: { value: Anchor }[] = [{ value: 'top' }, { value: 'middle' }, { value: 'bottom' }]

export default defineComponent({
  name: 'SlideCard',
  components: { IconButton, SlideAdjustments, SlideCanvas, StickerControls },
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
      aiBusy: '' as '' | 'title' | 'alt',
      selectedSticker: null as string | null,
      titleOptions: [] as string[],
    }
  },
  computed: {
    ...mapStores(useProjectStore, useAssetStore, useAiStore),
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
    mediaWord(): string {
      return this.info.video ? 'video' : 'image'
    },
    lowResWarning(): string {
      const frames = slotFrames(this.slide, this.projectStore.doc)
      for (const [i, slot] of this.slots.entries()) {
        const img = slot.asset ? this.assetsStore.images[slot.asset] : undefined
        if (img && fitImage(img, slot.zoom, frames[i].w, frames[i].h).scale > LOW_RES_SCALE) {
          const { width, height } = mediaSize(img)
          return `Low resolution (${width}×${height}px). It will look soft when posted.`
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
    onDragLeave(event: DragEvent) {
      // Moving onto one of the card's own children isn't leaving the card.
      const to = event.relatedTarget
      if (to instanceof Node && (this.$el as HTMLElement).contains(to)) return
      this.clearDrag()
    },
    clearDrag() {
      this.dragOver = false
      this.dropSide = null
    },
    onDrop(event: DragEvent) {
      const movedId = event.dataTransfer?.getData(SLIDE_DRAG_TYPE)
      if (movedId) {
        event.preventDefault()
        const target = this.index + (this.dropSide === 'after' ? 1 : 0)
        this.clearDrag()
        if (movedId !== this.slide.id) this.projectStore.moveSlide(movedId, target)
        return
      }
      if (!this.takesImage) return
      event.preventDefault()
      this.dragOver = false
      const kind = this.info.video ? 'video/' : 'image/'
      const file = [...(event.dataTransfer?.files ?? [])].find((f) => f.type.startsWith(kind))
      if (!file) {
        this.projectStore.status = `That drop had no ${this.mediaWord} file in it. Drag the saved file from your folder.`
        return
      }
      // Fill the first empty slot, else replace the first.
      const empty = this.slots.findIndex((s) => !s.asset)
      this.projectStore.setImage(this.slide.id, Math.max(0, empty), file)
    },
    async suggestTitles() {
      this.aiBusy = 'title'
      try {
        this.titleOptions = await suggestTitles(this.projectStore.project, this.slide)
      } catch (err) {
        this.projectStore.status = describeError(err)
      } finally {
        this.aiBusy = ''
      }
    },
    applyTitle(title: string) {
      this.projectStore.updateSlide(this.slide.id, { title })
      this.titleOptions = []
    },
    async suggestAlt() {
      this.aiBusy = 'alt'
      try {
        const jpeg = slideThumbnailBase64(this.slide, this.projectStore.doc)
        this.projectStore.updateSlide(this.slide.id, { alt: await suggestAltText(jpeg) })
      } catch (err) {
        this.projectStore.status = describeError(err)
      } finally {
        this.aiBusy = ''
      }
    },
    onType(event: Event) {
      this.projectStore.changeType(this.slide.id, (event.target as HTMLSelectElement).value as SlideType)
    },
    onText(field: 'title' | 'body' | 'alt', event: Event) {
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
    :data-slide-id="slide.id"
    :class="{ over: dragOver, 'drop-before': dropSide === 'before', 'drop-after': dropSide === 'after' }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div class="head">
      <span
        class="grip"
        draggable="true"
        title="Drag to reorder"
        @dragstart="onGripDragStart"
        @dragend="clearDrag"
      >
        <svg viewBox="0 0 10 16" aria-hidden="true"><circle cx="3" cy="3" r="1.3" /><circle cx="7" cy="3" r="1.3" /><circle cx="3" cy="8" r="1.3" /><circle cx="7" cy="8" r="1.3" /><circle cx="3" cy="13" r="1.3" /><circle cx="7" cy="13" r="1.3" /></svg>
        Slide {{ index + 1 }}
      </span>
      <select :value="slide.type" :aria-label="`Slide ${index + 1} type`" @change="onType">
        <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <div class="media">
      <SlideCanvas
        :slide="slide"
        :index="index"
        :selected-sticker="selectedSticker"
        @pick="pickFile"
        @select="selectedSticker = $event"
      />
      <span v-if="lowResWarning" class="badge" role="img" :aria-label="lowResWarning" :title="lowResWarning">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8l6.5 11.7h-13zM8 6.3v3.3M8 11.6h.01" /></svg>
        Low res
      </span>
    </div>

    <div class="group fields">
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

      <div v-if="aiStore.hasKey && info.title" class="suggest">
        <button class="link" :disabled="aiBusy === 'title'" @click="suggestTitles">
          {{ aiBusy === 'title' ? 'Thinking…' : `Suggest ${info.title.label.toLowerCase()}s` }}
        </button>
        <div v-if="titleOptions.length" class="options">
          <button v-for="t in titleOptions" :key="t" class="option" @click="applyTitle(t)">{{ t }}</button>
        </div>
      </div>
    </div>

    <div class="group">
      <div class="text-pos" role="group" :aria-label="`Slide ${index + 1} text position`">
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
      <StickerControls
        :slide="slide"
        :index="index"
        :selected="selectedSticker"
        @select="selectedSticker = $event"
      />
    </div>

    <div v-if="takesImage" class="group">
      <input ref="file" type="file" :accept="info.video ? 'video/*' : 'image/*'" hidden @change="onFileChange">
      <div v-for="(slot, i) in slots" :key="i" class="slot">
        <span class="zoom-label" aria-hidden="true">Zoom{{ slots.length > 1 ? ` ${i + 1}` : '' }}</span>
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
          {{ slot.asset ? 'Replace' : 'Add' }} {{ mediaWord }}
        </button>
      </div>
      <p v-if="info.imageHint" class="hint">{{ info.imageHint }}</p>
      <SlideAdjustments v-if="slots.some((s) => s.asset) || slide.type === 'cta'" :slide="slide" :index="index" />
    </div>

    <details class="group disclosure alt">
      <summary>Alt text<span v-if="slide.alt.trim()" class="set-dot" aria-label="(added)" /></summary>
      <textarea
        :value="slide.alt"
        rows="2"
        placeholder="Describe the slide for people using screen readers"
        :aria-label="`Slide ${index + 1} alt text`"
        @input="onText('alt', $event)"
      />
      <button v-if="aiStore.hasKey" class="link" :disabled="aiBusy === 'alt'" @click="suggestAlt">
        {{ aiBusy === 'alt' ? 'Looking at the slide…' : 'Suggest alt text' }}
      </button>
    </details>

    <div class="foot">
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
      <button class="btn download" @click="projectStore.downloadSlide(slide.id)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
        Download
      </button>
    </div>
  </div>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: var(--radius-lg);
  background: var(--panel);
  box-shadow: 0 0 0 1px var(--border);
  transition: box-shadow 0.12s;
}
/* The card you're working in is the "selected slide" the shortcuts act on. */
.card:focus-within { box-shadow: 0 0 0 2px var(--accent); }
.card.over { box-shadow: 0 0 0 2px var(--accent), 0 0 0 6px var(--accent-soft); }
/* Insertion marker when reordering. */
.card.drop-before::before, .card.drop-after::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 2px;
  background: var(--accent);
}
.card.drop-before::before { left: -10px; }
.card.drop-after::after { right: -10px; }

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 40px;
  padding: 0 8px 0 6px;
}
.grip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px 4px 2px;
  border-radius: var(--radius);
  font-weight: 600;
  white-space: nowrap;
  cursor: grab;
  user-select: none;
}
.grip:hover { background: var(--hover); }
.grip:active { cursor: grabbing; }
.grip svg { width: 10px; height: 14px; fill: var(--text-3); }
.head select { width: auto; min-width: 0; max-width: 65%; height: 26px; font-size: 12px; }

.media { position: relative; padding: 0 10px; }
.badge {
  position: absolute;
  top: 8px;
  left: 18px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px 3px 5px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.72);
  color: #ffc15c;
  font-size: 11px;
  font-weight: 600;
  pointer-events: auto;
  cursor: help;
}
.badge svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; }

.group { padding: 10px; border-top: 1px solid var(--border); }
.fields { display: grid; gap: 6px; padding-top: 10px; border-top: 0; }
.fields textarea { min-height: 0; }

.suggest { margin-top: 2px; }
.options { display: grid; gap: 4px; margin-top: 6px; }
.option {
  padding: 6px 8px;
  border: 0;
  border-radius: var(--radius);
  background: var(--field);
  color: var(--text);
  font: 13px var(--font);
  text-align: left;
  white-space: pre-line;
  cursor: pointer;
}
.option:hover { background: var(--accent-soft); }

.text-pos { display: flex; align-items: center; gap: 2px; }
.text-pos .sep { width: 1px; height: 16px; margin: 0 6px; background: var(--border-strong); }

.slot { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 10px; }
.slot + .slot { margin-top: 6px; }
.slot input[type=range] { width: 100%; }
.zoom-label { font-size: 12px; color: var(--text-2); }
.slot .btn { height: 26px; padding: 0 10px; font-size: 12px; }

.alt > summary { color: var(--text-2); font-size: 12px; }
.alt > summary:hover, .alt[open] > summary { color: var(--text); }
.alt textarea { margin-top: 8px; min-height: 0; }
.alt .link { margin-top: 6px; }

.foot {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: auto;
  padding: 8px 10px;
  border-top: 1px solid var(--border);
}
.download { height: 26px; margin-left: auto; padding: 0 10px; font-size: 12px; }
</style>
