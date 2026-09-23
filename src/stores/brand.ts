import { defineStore } from 'pinia'
import { normalizeBrandKit } from '../model/normalize'
import { db } from '../persist/db'
import type { BrandKit } from '../types'
import { useAssetStore } from './assets'
import { useProjectStore } from './project'

const KEY = 'brandKit'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Your saved handle, style and logo. Kept in this browser, separate from any project. */
export const useBrandStore = defineStore('brand', {
  state: () => ({
    kit: null as BrandKit | null,
  }),

  getters: {
    /** Assets the kit needs kept in storage. */
    assetIds: (state): string[] => (state.kit?.logo.asset ? [state.kit.logo.asset] : []),
  },

  actions: {
    async load() {
      try {
        const saved = await db.get<string>(KEY)
        this.kit = saved ? normalizeBrandKit(JSON.parse(saved)) : null
        await useAssetStore().restore(this.assetIds)
      } catch {
        this.kit = null
      }
    },

    async saveFromProject() {
      const project = useProjectStore()
      const { handle, theme, logo } = project.project
      this.kit = clone({ handle, theme, logo })
      try {
        await db.set(KEY, JSON.stringify(this.kit))
        project.status = 'Saved your brand kit. New projects will start with it.'
      } catch {
        project.status = "Couldn't save the brand kit because this browser is blocking storage."
      }
    },

    applyToProject() {
      if (!this.kit) return
      const project = useProjectStore()
      Object.assign(project.project, clone(this.kit))
      project.status = 'Applied your brand kit.'
    },

    async clear() {
      this.kit = null
      await db.set(KEY, '').catch(() => {})
      useProjectStore().status = 'Removed your brand kit.'
    },
  },
})
