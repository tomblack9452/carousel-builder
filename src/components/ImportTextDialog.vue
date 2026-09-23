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
    <header class="modal-head">
      <h2 id="import-title">Import slide text</h2>
    </header>
    <div class="modal-body">
      <p class="hint lead">
        Paste rows copied from a spreadsheet, or open a CSV file. Columns are title then body, with an optional
        slide type first (or use a header row: type, title, body). Separate list items with " | ".
      </p>
      <textarea v-model="text" rows="7" placeholder="Title&#9;Subtitle&#10;Second slide&#9;Its subtitle" aria-label="Rows to import" />
      <button class="btn open" @click="pickFile">Open CSV file</button>
      <input ref="file" type="file" accept=".csv,.tsv,.txt,text/csv" hidden @change="onFile">

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
          <p v-if="rows.length > 8" class="more">and {{ rows.length - 8 }} more</p>
        </div>
        <label class="radio"><input v-model="mode" type="radio" value="fill"> Replace text on my slides in order (not the cover or call to action)</label>
        <label class="radio"><input v-model="mode" type="radio" value="add"> Add a new slide for each row</label>
      </template>
    </div>
    <footer class="modal-foot">
      <button class="btn" @click="close">Cancel</button>
      <button class="btn primary" :disabled="!rows.length" @click="apply">Import</button>
    </footer>
  </dialog>
</template>

<style scoped>
.lead { margin: 0 0 10px; }
textarea { font-family: ui-monospace, Consolas, monospace; font-size: 12px; }
.open { margin-top: 8px; }
.table-wrap { max-height: 200px; overflow: auto; border-radius: var(--radius); box-shadow: inset 0 0 0 1px var(--border); }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--border); vertical-align: top; white-space: pre-line; }
th { position: sticky; top: 0; background: var(--panel-sunken); font-weight: 600; color: var(--text-2); }
td:first-child { color: var(--text-2); }
.more { margin: 0; padding: 6px 8px; font-size: 12px; color: var(--text-3); }
.radio { display: flex; gap: 8px; align-items: flex-start; margin: 10px 0 0; color: var(--text); cursor: pointer; }
.radio input { margin: 2px 0 0; }
</style>
