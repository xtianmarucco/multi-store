import { vi, describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCatalogStore } from '../stores/catalogStore'

vi.mock('../services/LocationsService', () => ({
  getLocations: vi.fn(),
}))
vi.mock('../services/LabelsService', () => ({
  getLabels: vi.fn(),
}))
vi.mock('../services/CategoriesService', () => ({
  getCategories: vi.fn(),
}))

import { getLocations } from '../services/LocationsService'
import { getLabels } from '../services/LabelsService'
import { getCategories } from '../services/CategoriesService'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  getLocations.mockResolvedValue([])
  getLabels.mockResolvedValue([])
  getCategories.mockResolvedValue([{ id: 1, name: 'Indumentaria', parent_id: null }])
})

describe('fetchCategories', () => {
  it('guarda las categorías y expone el árbol con profundidad', () => {
    const store = useCatalogStore()
    return store.fetchCategories().then(() => {
      expect(getCategories).toHaveBeenCalled()
      expect(store.categories).toHaveLength(1)
      expect(store.categoryTree).toEqual([
        { id: 1, name: 'Indumentaria', parent_id: null, depth: 0 },
      ])
    })
  })

  it('fetchAll trae ubicaciones, etiquetas y categorías sin romper lo existente', async () => {
    const store = useCatalogStore()
    await store.fetchAll()
    expect(getLocations).toHaveBeenCalled()
    expect(getLabels).toHaveBeenCalled()
    expect(getCategories).toHaveBeenCalled()
    expect(store.loading).toBe(false)
  })
})
