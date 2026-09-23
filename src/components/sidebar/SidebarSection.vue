<script lang="ts">
import { defineComponent } from 'vue'

/** Collapsible sidebar group. Remembers open/closed per title in this browser. */
export default defineComponent({
  name: 'SidebarSection',
  props: {
    title: { type: String, required: true },
    defaultOpen: { type: Boolean, default: true },
  },
  data() {
    return { open: this.defaultOpen }
  },
  computed: {
    storageKey(): string {
      return `sidebar-open:${this.title}`
    },
  },
  created() {
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved !== null) this.open = saved === '1'
    } catch {
      // Storage blocked: keep the default.
    }
  },
  methods: {
    onToggle(event: Event) {
      this.open = (event.target as HTMLDetailsElement).open
      try {
        localStorage.setItem(this.storageKey, this.open ? '1' : '0')
      } catch {
        // Not important enough to report.
      }
    },
  },
})
</script>

<template>
  <details class="section" :open="open" @toggle="onToggle">
    <summary>{{ title }}</summary>
    <div class="body">
      <slot />
    </div>
  </details>
</template>

<style scoped>
.section { border-top: 1px solid var(--border); }
summary {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  list-style: none;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}
summary::-webkit-details-marker { display: none; }
summary::before {
  content: '';
  width: 8px;
  height: 5px;
  flex: none;
  background: var(--chevron) no-repeat center;
  transform: rotate(-90deg);
  transition: transform 0.12s;
}
.section[open] > summary::before { transform: none; }
summary:hover { background: var(--hover); }
.body { padding: 0 16px 18px; }
.body > :deep(:first-child) { margin-top: 2px; }
</style>
