import { vi, describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStocksStore } from '../stores/stocksStore'

vi.mock('../services/StocksService', () => ({
  getStocks: vi.fn(),
  adjustStock: vi.fn(),
  transferStock: vi.fn(),
}))

import { getStocks, adjustStock, transferStock } from '../services/StocksService'

const page = (stocks, total = stocks.length) => ({ stocks, total, page: 1, pageSize: 20 })

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  getStocks.mockResolvedValue(page([{ id: 1, product_id: 2, location_id: 3, quantity: 5 }]))
})

describe('fetchStocks', () => {
  it('solo envía los filtros con valor', async () => {
    const store = useStocksStore()
    await store.fetchStocks()
    expect(getStocks).toHaveBeenCalledWith({ page: 1, pageSize: 20 })
    expect(store.stocks).toHaveLength(1)
    expect(store.total).toBe(1)
  })

  it('loading vuelve a false aunque la API falle', async () => {
    getStocks.mockRejectedValue(new Error('boom'))
    const store = useStocksStore()
    await expect(store.fetchStocks()).rejects.toThrow()
    expect(store.loading).toBe(false)
  })
})

describe('applyFilters', () => {
  it('vuelve a la página 1 y envía los filtros activos', async () => {
    const store = useStocksStore()
    store.page = 3
    await store.applyFilters({ product_id: '2', location_id: '3' })
    expect(store.page).toBe(1)
    expect(getStocks).toHaveBeenLastCalledWith({
      page: 1, pageSize: 20, product_id: '2', location_id: '3',
    })
  })

  it('resetFilters limpia todos los filtros', async () => {
    const store = useStocksStore()
    await store.applyFilters({ location_id: '3' })
    await store.resetFilters()
    expect(store.filters).toEqual({ product_id: '', location_id: '' })
  })
})

describe('goToPage', () => {
  it('limita la página al rango válido', async () => {
    getStocks.mockResolvedValue(page([], 45))
    const store = useStocksStore()
    await store.fetchStocks()
    expect(store.totalPages).toBe(3)

    await store.goToPage(10)
    expect(store.page).toBe(3)
    await store.goToPage(0)
    expect(store.page).toBe(1)
  })
})

describe('adjust / transfer', () => {
  it('adjust delega al servicio y recarga el listado', async () => {
    adjustStock.mockResolvedValue({ id: 1, quantity: 10 })
    const store = useStocksStore()
    await store.adjust({ product_id: 2, location_id: 3, quantity: 10 })
    expect(adjustStock).toHaveBeenCalledWith({ product_id: 2, location_id: 3, quantity: 10 })
    expect(getStocks).toHaveBeenCalled()
  })

  it('transfer delega al servicio y recarga el listado', async () => {
    transferStock.mockResolvedValue({ quantity: 2 })
    const store = useStocksStore()
    await store.transfer({ product_id: 2, from_location_id: 3, to_location_id: 4, quantity: 2 })
    expect(transferStock).toHaveBeenCalledWith({
      product_id: 2, from_location_id: 3, to_location_id: 4, quantity: 2,
    })
    expect(getStocks).toHaveBeenCalled()
  })
})
