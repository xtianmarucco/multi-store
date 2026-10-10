import { defineStore } from 'pinia'
import { getProducts } from '../services/ProductsService'

const defaultFilters = () => ({ search: '', category_id: '', label_id: '', active: 'all' })

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [],
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
    async fetchProducts() {
      this.loading = true
      try {
        const params = { page: this.page, pageSize: this.pageSize }
        if (this.filters.search.trim()) params.search = this.filters.search.trim()
        if (this.filters.category_id) params.category_id = this.filters.category_id
        if (this.filters.label_id) params.label_id = this.filters.label_id
        if (this.filters.active && this.filters.active !== 'all') params.active = this.filters.active

        const data = await getProducts(params)
        this.products = data.products
        this.total = data.total
      } finally {
        this.loading = false
      }
    },

    // Cualquier cambio de filtro vuelve a la primera página.
    async applyFilters(changes) {
      this.filters = { ...this.filters, ...changes }
      this.page = 1
      await this.fetchProducts()
    },

    async resetFilters() {
      this.filters = defaultFilters()
      this.page = 1
      await this.fetchProducts()
    },

    async goToPage(page) {
      this.page = Math.min(Math.max(1, page), this.totalPages)
      await this.fetchProducts()
    }
  }
})
