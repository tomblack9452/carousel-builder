import { defineStore } from 'pinia'
import { getApiKey, setApiKey } from '../ai/claude'

/** Whether AI suggestions are switched on (an API key is saved in this browser). */
export const useAiStore = defineStore('ai', {
  state: () => ({
    hasKey: !!getApiKey(),
  }),

  actions: {
    saveKey(key: string) {
      setApiKey(key.trim())
      this.hasKey = !!key.trim()
    },
    removeKey() {
      setApiKey('')
      this.hasKey = false
    },
  },
})
