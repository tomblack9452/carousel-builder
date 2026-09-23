<script lang="ts">
import { defineComponent, type PropType } from 'vue'

/** 24×24 stroke icons. */
const ICONS = {
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  copy: 'M8 8h11v11H8zM5 16V5h11',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
} as const

export type IconName = keyof typeof ICONS

export default defineComponent({
  name: 'IconButton',
  props: {
    icon: { type: String as PropType<IconName>, required: true },
    label: { type: String, required: true },
  },
  computed: {
    path(): string {
      return ICONS[this.icon]
    },
  },
})
</script>

<template>
  <button class="icon-btn" type="button" :aria-label="label" :title="label">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path :d="path" />
    </svg>
  </button>
</template>

<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--dusk);
  color: var(--text);
  cursor: pointer;
  flex: none;
}
.icon-btn:hover:not(:disabled) { border-color: var(--muted); }
.icon-btn:disabled { opacity: 0.35; cursor: default; }
svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
