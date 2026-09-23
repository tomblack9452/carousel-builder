import { defineStore } from 'pinia'
import { uid } from '../model/factory'
import { normalizeProject } from '../model/normalize'
import { BUILT_IN_TEMPLATES, type Template, projectFromTemplate, toTemplateProject } from '../model/templates'
import { db } from '../persist/db'
import { useProjectStore } from './project'

const KEY = 'templates'

/** Built-in starters plus templates you've saved in this browser. */
export const useTemplateStore = defineStore('templates', {
  state: () => ({
    saved: [] as Template[],
  }),

  getters: {
    all: (state): Template[] => [...BUILT_IN_TEMPLATES, ...state.saved],
  },

  actions: {
    async load() {
      try {
        const raw = JSON.parse((await db.get<string>(KEY)) || '[]') as unknown
        this.saved = (Array.isArray(raw) ? raw : []).flatMap((t) => {
          try {
            return [{ id: String(t.id), name: String(t.name), project: normalizeProject(t.project) }]
          } catch {
            return []
          }
        })
      } catch {
        this.saved = []
      }
    },

    async persist() {
      await db.set(KEY, JSON.stringify(this.saved)).catch(() => {
        useProjectStore().status = "Couldn't save templates because this browser is blocking storage."
      })
    },

    async saveCurrent(name: string) {
      const project = useProjectStore()
      this.saved.push({ id: uid(), name, project: toTemplateProject(project.project) })
      await this.persist()
      project.status = `Saved "${name}" as a template.`
    },

    async remove(id: string) {
      this.saved = this.saved.filter((t) => t.id !== id)
      await this.persist()
    },

    /** Start a project from a template, keeping your handle, logo and slide size. */
    use(id: string) {
      const template = this.all.find((t) => t.id === id)
      if (!template) return
      const store = useProjectStore()
      const { handle, logo, aspect } = store.project
      store.project = { ...projectFromTemplate(template), handle, logo, aspect }
      store.status = `Started from the "${template.name}" template.`
    },
  },
})
