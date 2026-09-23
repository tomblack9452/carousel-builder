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
.section { border-top: 1px solid var(--line); padding: 14px 0 4px; }
summary {
  cursor: pointer;
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 600;
  font-size: 18px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--muted);
  list-style-position: outside;
}
.body { padding-bottom: 12px; }
.body > :deep(label:first-child) { margin-top: 10px; }
</style>
