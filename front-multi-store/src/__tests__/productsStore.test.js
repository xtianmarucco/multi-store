import { vi, describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductsStore } from '../stores/productsStore'

vi.mock('../services/ProductsService', () => ({
  getProducts: vi.fn(),
}))

import { getProducts } from '../services/ProductsService'

const page = (products, total = products.length) => ({ products, total, page: 1, pageSize: 20 })

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  getProducts.mockResolvedValue(page([{ id: 1, name: 'Remera', sku: 'REM-001' }]))
})

describe('fetchProducts', () => {
  it('solo envía los filtros con valor', async () => {
    const store = useProductsStore()
    await store.fetchProducts()
    expect(getProducts).toHaveBeenCalledWith({ page: 1, pageSize: 20 })
    expect(store.products).toHaveLength(1)
    expect(store.total).toBe(1)
  })

  it('loading vuelve a false aunque la API falle', async () => {
    getProducts.mockRejectedValue(new Error('boom'))
    const store = useProductsStore()
    await expect(store.fetchProducts()).rejects.toThrow()
    expect(store.loading).toBe(false)
  })
})

describe('applyFilters', () => {
  it('vuelve a la página 1 y envía los filtros activos', async () => {
    const store = useProductsStore()
    store.page = 3
    await store.applyFilters({ search: ' remera ', category_id: '2', active: 'false' })
    expect(store.page).toBe(1)
    expect(getProducts).toHaveBeenLastCalledWith({
      page: 1, pageSize: 20, search: 'remera', category_id: '2', active: 'false',
    })
  })

  it('resetFilters limpia todos los filtros', async () => {
    const store = useProductsStore()
    await store.applyFilters({ label_id: '5' })
    await store.resetFilters()
    expect(store.filters).toEqual({ search: '', category_id: '', label_id: '', active: 'all' })
  })
})

describe('goToPage', () => {
  it('limita la página al rango válido', async () => {
    getProducts.mockResolvedValue(page([], 45))
    const store = useProductsStore()
    await store.fetchProducts()
    expect(store.totalPages).toBe(3)

    await store.goToPage(10)
    expect(store.page).toBe(3)
    await store.goToPage(0)
    expect(store.page).toBe(1)
  })
})
