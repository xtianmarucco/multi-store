import { defineStore } from 'pinia'
import { getLocations } from '../services/LocationsService'
import { getLabels } from '../services/LabelsService'
import { getCategories } from '../services/CategoriesService'
import { buildLocationTree } from '../utils/locationTree'
import { buildCategoryTree } from '../utils/categoryTree'

// Ubicaciones, etiquetas y categorías: listas chicas que usan formularios, filtros y vistas de gestión.
export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    locations: [],
    labels: [],
    categories: [],
    loading: false
  }),

  getters: {
    locationTree: (state) => buildLocationTree(state.locations),
    categoryTree: (state) => buildCategoryTree(state.categories)
  },

  actions: {
    async fetchLocations() {
      this.locations = await getLocations()
    },

    async fetchLabels() {
      this.labels = await getLabels()
    },

    async fetchCategories() {
      this.categories = await getCategories()
    },

    async fetchAll() {
      this.loading = true
      try {
        await Promise.all([this.fetchLocations(), this.fetchLabels(), this.fetchCategories()])
      } finally {
        this.loading = false
      }
    }
  }
})
