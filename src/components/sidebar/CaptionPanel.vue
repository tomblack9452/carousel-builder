<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { CAPTION_MAX, HASHTAG_MAX } from '../../constants'
import { useProjectStore } from '../../stores/project'
import SidebarSection from './SidebarSection.vue'

export default defineComponent({
  name: 'CaptionPanel',
  components: { SidebarSection },
  data() {
    return { CAPTION_MAX, HASHTAG_MAX, copied: false }
  },
  computed: {
    ...mapStores(useProjectStore),
    length(): number {
      return [...this.projectStore.project.caption].length
    },
    hashtags(): number {
      return (this.projectStore.project.caption.match(/(^|\s)#[\p{L}\p{N}_]+/gu) ?? []).length
    },
  },
  methods: {
    async copy() {
      try {
        await navigator.clipboard.writeText(this.projectStore.project.caption)
        this.copied = true
        setTimeout(() => { this.copied = false }, 1500)
      } catch {
        this.projectStore.status = "Couldn't copy automatically. Select the caption and copy it yourself."
      }
    },
  },
})
</script>

<template>
  <SidebarSection title="Caption" :default-open="false">
    <label for="caption">Post caption</label>
    <textarea id="caption" v-model="projectStore.project.caption" rows="6" placeholder="Write your caption and hashtags" />
    <p class="counts">
      <span :class="{ over: length > CAPTION_MAX }">{{ length }} / {{ CAPTION_MAX }} characters</span>
      <span :class="{ over: hashtags > HASHTAG_MAX }">{{ hashtags }} / {{ HASHTAG_MAX }} hashtags</span>
    </p>
    <button class="btn copy" :disabled="!projectStore.project.caption" @click="copy">
      {{ copied ? 'Copied' : 'Copy caption' }}
    </button>
    <p class="hint">Also saved as caption.txt in the zip when you download all slides.</p>
  </SidebarSection>
</template>

<style scoped>
.counts { display: flex; justify-content: space-between; margin: 6px 0 8px; font-size: 13px; color: var(--muted); }
.over { color: var(--amber); font-weight: 600; }
.copy { width: 100%; }
.copy:disabled { opacity: 0.5; cursor: default; }
</style>
