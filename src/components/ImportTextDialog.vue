<script lang="ts">
import { defineComponent } from 'vue'
import { mapStores } from 'pinia'
import { type TextRow, parseTable, rowsToText } from '../model/csv'
import { SLIDE_TYPES } from '../model/slideTypes'
import { useProjectStore } from '../stores/project'

export default defineComponent({
  name: 'ImportTextDialog',
  data() {
    return {
      text: '',
      mode: 'fill' as 'fill' | 'add',
    }
  },
  computed: {
    ...mapStores(useProjectStore),
    rows(): TextRow[] {
      return rowsToText(parseTable(this.text))
    },
  },
  methods: {
    open() {
      (this.$refs.dialog as HTMLDialogElement).showModal()
    },
    close() {
      (this.$refs.dialog as HTMLDialogElement).close()
    },
    typeLabel(row: TextRow): string {
      return row.type ? SLIDE_TYPES[row.type].label : ''
    },
    pickFile() {
      (this.$refs.file as HTMLInputElement).click()
    },
    async onFile(event: Event) {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      if (file) this.text = await file.text()
      input.value = ''
    },
    apply() {
      this.projectStore.importText(this.rows, this.mode)
      this.text = ''
      this.close()
    },
  },
})
</script>

<template>
  <dialog ref="dialog" class="modal" aria-labelledby="import-title">
    <h2 id="import-title">Import slide text</h2>
    <p class="hint">
      Paste rows copied from a spreadsheet, or open a CSV file. Columns are title then body, with an optional
      slide type first (or use a header row: type, title, body). Separate list items with " | ".
    </p>
    <textarea v-model="text" rows="7" placeholder="Title&#9;Subtitle&#10;Second slide&#9;Its subtitle" aria-label="Rows to import" />
    <div class="row">
      <button class="btn" @click="pickFile">Open CSV file</button>
      <input ref="file" type="file" accept=".csv,.tsv,.txt,text/csv" hidden @change="onFile">
    </div>

    <template v-if="rows.length">
      <p class="field-label">{{ rows.length }} row{{ rows.length === 1 ? '' : 's' }} found</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Type</th><th>Title</th><th>Body</th></tr></thead>
          <tbody>
            <tr v-for="(r, i) in rows.slice(0, 8)" :key="i">
              <td>{{ typeLabel(r) }}</td><td>{{ r.title }}</td><td>{{ r.body }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="rows.length > 8" class="hint">and {{ rows.length - 8 }} more</p>
      </div>
      <label class="radio"><input v-model="mode" type="radio" value="fill"> Replace text on my slides in order (not the cover or call to action)</label>
      <label class="radio"><input v-model="mode" type="radio" value="add"> Add a new slide for each row</label>
    </template>

    <div class="row actions">
      <button class="btn" @click="close">Cancel</button>
      <button class="btn primary" :disabled="!rows.length" @click="apply">Import</button>
    </div>
  </dialog>
</template>

<style scoped>
.modal {
  width: min(560px, calc(100vw - 32px));
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);
  color: var(--text);
}
.modal::backdrop { background: rgba(10, 8, 18, 0.7); }
h2 { margin: 0 0 6px; font: 400 26px Anton, Impact, sans-serif; }
textarea { margin-top: 10px; font-family: ui-monospace, monospace; font-size: 13px; }
.table-wrap { max-height: 200px; overflow: auto; border: 1px solid var(--line); border-radius: 6px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--line); vertical-align: top; white-space: pre-line; }
th { color: var(--muted); font-weight: 600; }
.radio { display: flex; gap: 8px; align-items: center; margin: 10px 0 0; font-weight: 400; }
.radio input { accent-color: var(--amber); }
.actions { justify-content: flex-end; margin-top: 16px; }
.actions .btn { flex: none; }
.btn:disabled { opacity: 0.5; cursor: default; }
</style>
