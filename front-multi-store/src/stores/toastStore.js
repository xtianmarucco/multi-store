import { defineStore } from 'pinia'

let nextId = 0

export const useToastStore = defineStore('toast', {
  state: () => ({ toasts: [] }),
  actions: {
    add(message, type = 'success', duration = 4000) {
      const id = ++nextId
      this.toasts.push({ id, message, type })
      setTimeout(() => this.remove(id), duration)
    },
    remove(id) {
      this.toasts = this.toasts.filter(t => t.id !== id)
    }
  }
})
