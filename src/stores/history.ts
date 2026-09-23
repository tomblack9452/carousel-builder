import { defineStore } from 'pinia'
import type { Project } from '../types'
import { useProjectStore } from './project'

const LIMIT = 100
/** Changes closer together than this become one undo step (a typed word, one drag). */
const GROUP_DELAY = 300

let current = ''
let timer = 0
let pending = false

/** Snapshot undo/redo over the whole project. Images are ids, so snapshots stay small. */
export const useHistoryStore = defineStore('history', {
  state: () => ({
    past: [] as string[],
    future: [] as string[],
  }),

  getters: {
    canUndo: (state) => state.past.length > 0,
    canRedo: (state) => state.future.length > 0,
  },

  actions: {
    /** Start recording from the project's current state. Call once it has loaded. */
    start() {
      const project = useProjectStore()
      current = JSON.stringify(project.project)
      this.past = []
      this.future = []
      project.$subscribe(() => this.schedule(), { detached: true })
    },

    schedule() {
      pending = true
      clearTimeout(timer)
      timer = window.setTimeout(() => this.record(), GROUP_DELAY)
    },

    record() {
      clearTimeout(timer)
      pending = false
      const json = JSON.stringify(useProjectStore().project)
      if (json === current) return
      this.past.push(current)
      if (this.past.length > LIMIT) this.past.shift()
      this.future = []
      current = json
    },

    undo() {
      if (pending) this.record()
      const previous = this.past.pop()
      if (previous === undefined) return
      this.future.push(current)
      this.apply(previous)
    },

    redo() {
      if (pending) this.record()
      const next = this.future.pop()
      if (next === undefined) return
      this.past.push(current)
      this.apply(next)
    },

    apply(json: string) {
      current = json
      useProjectStore().project = JSON.parse(json) as Project
    },
  },
})
