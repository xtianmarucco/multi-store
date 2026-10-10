import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const repo = require('../repositories/dashboard.repository')
const { getSummary } = require('../services/dashboard.service')

const GROUP_ID = 1

const fullSummary = {
  total_items: 8, total_locations: 2, total_labels: 3, total_value: 500,
  total_products: 4, total_categories: 2,
  capital_total: 1200, capital_warehouse: 800, capital_store: 400,
  low_stock_count: 1
}

beforeEach(() => {
  vi.spyOn(repo, 'getSummary').mockResolvedValue(fullSummary)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('dashboard summary', () => {
  it('pasa el group_id de la sesión al repositorio', async () => {
    await getSummary(GROUP_ID)
    expect(repo.getSummary).toHaveBeenCalledWith(GROUP_ID)
  })

  it('expone las claves históricas de items (vivas hasta T7)', async () => {
    const data = await getSummary(GROUP_ID)
    expect(data).toMatchObject({
      total_items: 8, total_locations: 2, total_labels: 3, total_value: 500
    })
  })

  it('expone las claves nuevas de capital del catálogo', async () => {
    const data = await getSummary(GROUP_ID)
    expect(data).toMatchObject({
      total_products: 4, total_categories: 2,
      capital_total: 1200, capital_warehouse: 800, capital_store: 400,
      low_stock_count: 1
    })
  })
})
