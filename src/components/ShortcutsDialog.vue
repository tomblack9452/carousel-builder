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
    <header class="modal-head">
      <h2 id="shortcuts-title">Keyboard shortcuts</h2>
    </header>
    <div class="modal-body">
      <section v-for="g in SHORTCUTS" :key="g.group">
        <h3>{{ g.group }}</h3>
        <dl>
          <template v-for="[keys, action] in g.items" :key="keys">
            <dt><kbd>{{ keys }}</kbd></dt>
            <dd>{{ action }}</dd>
          </template>
        </dl>
      </section>
    </div>
    <p class="hint mac">On a Mac, use Cmd instead of Ctrl.</p>
    <footer class="modal-foot"><button class="btn" @click="close">Close</button></footer>
  </dialog>
</template>

<style scoped>
section + section { margin-top: 16px; }
h3 { margin: 0 0 6px; font-size: 12px; font-weight: 600; color: var(--text-2); }
dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; align-items: center; margin: 0; }
dt { white-space: nowrap; }
dd { margin: 0; }
.mac { margin: 0; padding: 0 18px 14px; }
</style>
