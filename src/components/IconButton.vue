<script lang="ts">
import { defineComponent, type PropType } from 'vue'

/** 24×24 stroke icons. */
const ICONS = {
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  copy: 'M8 8h11v11H8zM5 16V5h11',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  alignLeft: 'M4 6h16M4 10h10M4 14h16M4 18h10',
  alignCenter: 'M4 6h16M7 10h10M4 14h16M7 18h10',
  alignRight: 'M4 6h16M10 10h10M4 14h16M10 18h10',
  top: 'M4 4h16M12 20V9M8 13l4-4 4 4',
  middle: 'M4 12h16M12 3v5M9 5l3 3 3-3M12 21v-5M9 19l3-3 3 3',
  bottom: 'M4 20h16M12 4v11M8 11l4 4 4-4',
  redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
} as const

export type IconName = keyof typeof ICONS

export default defineComponent({
  name: 'IconButton',
  props: {
    icon: { type: String as PropType<IconName>, required: true },
    label: { type: String, required: true },
    /** Shows as pressed, for toggle groups. Omit for plain buttons. */
    active: { type: Boolean, default: undefined },
  },
  computed: {
    path(): string {
      return ICONS[this.icon]
    },
  },
})
</script>

<template>
  <button
    class="icon-btn"
    :class="{ active }"
    type="button"
    :aria-label="label"
    :aria-pressed="active"
    :title="label"
  >
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
.icon-btn.active { border-color: var(--amber); color: var(--amber); }
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
