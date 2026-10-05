import { defineStore } from 'pinia'
import { getLocations } from '../services/LocationsService'
import { getLabels } from '../services/LabelsService'
import { buildLocationTree } from '../utils/locationTree'

// Ubicaciones y etiquetas: listas chicas que usan formularios, filtros y vistas de gestión.
export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    locations: [],
    labels: [],
    loading: false
  }),

  getters: {
    locationTree: (state) => buildLocationTree(state.locations)
  },

  actions: {
    async fetchLocations() {
      this.locations = await getLocations()
    },

    async fetchLabels() {
      this.labels = await getLabels()
    },

    async fetchAll() {
      this.loading = true
      try {
        await Promise.all([this.fetchLocations(), this.fetchLabels()])
      } finally {
        this.loading = false
      }
    }
  }
})
