import { defineStore } from 'pinia'
import { getItems } from '../services/ItemsService'

const defaultFilters = () => ({ search: '', location_id: '', label_id: '', archived: false })

export const useItemsStore = defineStore('items', {
  state: () => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    filters: defaultFilters(),
    loading: false
  }),

  getters: {
    totalPages: (state) => Math.max(1, Math.ceil(state.total / state.pageSize))
  },

  actions: {
    async fetchItems() {
      this.loading = true
      try {
        const params = { page: this.page, pageSize: this.pageSize }
        if (this.filters.search.trim()) params.search = this.filters.search.trim()
        if (this.filters.location_id) params.location_id = this.filters.location_id
        if (this.filters.label_id) params.label_id = this.filters.label_id
        if (this.filters.archived) params.archived = 'true'

        const data = await getItems(params)
        this.items = data.items
        this.total = data.total
      } finally {
        this.loading = false
      }
    },

    // Cualquier cambio de filtro vuelve a la primera página.
    async applyFilters(changes) {
      this.filters = { ...this.filters, ...changes }
      this.page = 1
      await this.fetchItems()
    },

    async resetFilters() {
      this.filters = defaultFilters()
      this.page = 1
      await this.fetchItems()
    },

    async goToPage(page) {
      this.page = Math.min(Math.max(1, page), this.totalPages)
      await this.fetchItems()
    }
  }
})
