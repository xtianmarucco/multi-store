import { defineStore } from 'pinia'
import { getStocks, adjustStock, transferStock } from '../services/StocksService'

const defaultFilters = () => ({ product_id: '', location_id: '' })

export const useStocksStore = defineStore('stocks', {
  state: () => ({
    stocks: [],
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
    async fetchStocks() {
      this.loading = true
      try {
        const params = { page: this.page, pageSize: this.pageSize }
        if (this.filters.product_id) params.product_id = this.filters.product_id
        if (this.filters.location_id) params.location_id = this.filters.location_id

        const data = await getStocks(params)
        this.stocks = data.stocks
        this.total = data.total
      } finally {
        this.loading = false
      }
    },

    // Cualquier cambio de filtro vuelve a la primera página.
    async applyFilters(changes) {
      this.filters = { ...this.filters, ...changes }
      this.page = 1
      await this.fetchStocks()
    },

    async resetFilters() {
      this.filters = defaultFilters()
      this.page = 1
      await this.fetchStocks()
    },

    async goToPage(page) {
      this.page = Math.min(Math.max(1, page), this.totalPages)
      await this.fetchStocks()
    },

    async adjust(payload) {
      const result = await adjustStock(payload)
      await this.fetchStocks()
      return result
    },

    async transfer(payload) {
      const result = await transferStock(payload)
      await this.fetchStocks()
      return result
    }
  }
})
