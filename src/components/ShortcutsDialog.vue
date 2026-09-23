<script lang="ts">
import { defineComponent } from 'vue'
import { SHORTCUTS } from '../shortcuts'

export default defineComponent({
  name: 'ShortcutsDialog',
  data() {
    return { SHORTCUTS }
  },
  methods: {
    open() {
      (this.$refs.dialog as HTMLDialogElement).showModal()
    },
    close() {
      (this.$refs.dialog as HTMLDialogElement).close()
    },
    /** Close on backdrop clicks only: a click in the dialog's own padding also targets the dialog. */
    onClick(event: MouseEvent) {
      const dialog = this.$refs.dialog as HTMLDialogElement
      if (event.target !== dialog) return
      const r = dialog.getBoundingClientRect()
      const inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom
      if (!inside) this.close()
    },
  },
})
</script>

<template>
  <dialog ref="dialog" class="modal" aria-labelledby="shortcuts-title" @click="onClick">
    <h2 id="shortcuts-title">Keyboard shortcuts</h2>
    <section v-for="g in SHORTCUTS" :key="g.group">
      <h3>{{ g.group }}</h3>
      <dl>
        <template v-for="[keys, action] in g.items" :key="keys">
          <dt><kbd>{{ keys }}</kbd></dt>
          <dd>{{ action }}</dd>
        </template>
      </dl>
    </section>
    <p class="hint">On a Mac, use Cmd instead of Ctrl.</p>
    <div class="row actions"><button class="btn" @click="close">Close</button></div>
  </dialog>
</template>

<style scoped>
.modal {
  width: min(480px, calc(100vw - 32px));
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);
  color: var(--text);
}
.modal::backdrop { background: rgba(10, 8, 18, 0.7); }
h2 { margin: 0 0 8px; font: 400 26px Anton, Impact, sans-serif; }
h3 { margin: 14px 0 6px; font-size: 14px; color: var(--muted); }
dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 0; }
dt { white-space: nowrap; }
dd { margin: 0; }
kbd {
  padding: 1px 6px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--dusk);
  font: 600 12px ui-monospace, monospace;
}
.actions { justify-content: flex-end; margin-top: 14px; }
.actions .btn { flex: none; }
</style>
