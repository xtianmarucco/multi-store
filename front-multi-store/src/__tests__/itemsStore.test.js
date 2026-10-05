import { vi, describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useItemsStore } from '../stores/itemsStore'

vi.mock('../services/ItemsService', () => ({
  getItems: vi.fn(),
}))

import { getItems } from '../services/ItemsService'

const page = (items, total = items.length) => ({ items, total, page: 1, pageSize: 20 })

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  getItems.mockResolvedValue(page([{ id: 1, name: 'Taladro' }]))
})

describe('fetchItems', () => {
  it('solo envía los filtros con valor', async () => {
    const store = useItemsStore()
    await store.fetchItems()
    expect(getItems).toHaveBeenCalledWith({ page: 1, pageSize: 20 })
    expect(store.items).toHaveLength(1)
    expect(store.total).toBe(1)
  })

  it('loading vuelve a false aunque la API falle', async () => {
    getItems.mockRejectedValue(new Error('boom'))
    const store = useItemsStore()
    await expect(store.fetchItems()).rejects.toThrow()
    expect(store.loading).toBe(false)
  })
})

describe('applyFilters', () => {
  it('vuelve a la página 1 y envía los filtros activos', async () => {
    const store = useItemsStore()
    store.page = 3
    await store.applyFilters({ search: ' bosch ', location_id: '2', archived: true })
    expect(store.page).toBe(1)
    expect(getItems).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: 'bosch', location_id: '2', archived: 'true' })
  })

  it('resetFilters limpia todos los filtros', async () => {
    const store = useItemsStore()
    await store.applyFilters({ label_id: '5' })
    await store.resetFilters()
    expect(store.filters).toEqual({ search: '', location_id: '', label_id: '', archived: false })
  })
})

describe('goToPage', () => {
  it('limita la página al rango válido', async () => {
    getItems.mockResolvedValue(page([], 45))
    const store = useItemsStore()
    await store.fetchItems()
    expect(store.totalPages).toBe(3)

    await store.goToPage(10)
    expect(store.page).toBe(3)
    await store.goToPage(0)
    expect(store.page).toBe(1)
  })
})
