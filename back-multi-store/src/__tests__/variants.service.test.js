import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const repo = require('../repositories/variants.repository')
const productsRepo = require('../repositories/products.repository')
const { getAll, create, update, remove } = require('../services/variants.service')

const GROUP_ID = 1
const PRODUCT_ID = 7

const basePayload = () => ({
  sku: 'YERBA-001-500G',
  barcode: '7791234567890',
  attributes: { peso: '500g' },
  cost_price: 600,
  sale_price: 950,
  min_stock: 2,
  active: true
})

beforeEach(() => {
  vi.spyOn(productsRepo, 'findById').mockImplementation(async (groupId, id) =>
    groupId === GROUP_ID && id === PRODUCT_ID ? { id: PRODUCT_ID, sku: 'YERBA-001' } : null)
  vi.spyOn(repo, 'findByProduct').mockResolvedValue([])
  vi.spyOn(repo, 'findById').mockImplementation(async (groupId, id) =>
    groupId === GROUP_ID && id === 11
      ? { id: 11, product_id: PRODUCT_ID, sku: 'YERBA-001-500G' }
      : null)
  vi.spyOn(repo, 'create').mockImplementation(async (data) => ({ id: 11, ...data }))
  vi.spyOn(repo, 'update').mockImplementation(async (id, data) => ({ id, ...data }))
  vi.spyOn(repo, 'remove').mockResolvedValue({})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('create', () => {
  it('crea la variante cuando el producto existe en el grupo', async () => {
    await create(GROUP_ID, PRODUCT_ID, basePayload())
    expect(productsRepo.findById).toHaveBeenCalledWith(GROUP_ID, PRODUCT_ID)
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      sku: 'YERBA-001-500G',
      product_id: PRODUCT_ID,
      group_id: GROUP_ID
    }))
  })

  it('lanza NOT_FOUND si el producto no existe en el grupo', async () => {
    await expect(create(GROUP_ID, 99, basePayload()))
      .rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('trata un producto de otro grupo como inexistente', async () => {
    await expect(create(2, PRODUCT_ID, basePayload()))
      .rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('propaga el error de sku duplicado (P2002 → DUPLICATE 409 vía handleError)', async () => {
    const err = new Error('Unique constraint failed')
    err.code = 'P2002'
    repo.create.mockRejectedValueOnce(err)
    await expect(create(GROUP_ID, PRODUCT_ID, basePayload())).rejects.toMatchObject({ code: 'P2002' })
  })

  it('rechaza sku faltante con VALIDATION_ERROR 400', async () => {
    const { sku, ...payload } = basePayload()
    await expect(create(GROUP_ID, PRODUCT_ID, payload))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('rechaza attributes no-objeto con VALIDATION_ERROR 400', async () => {
    await expect(create(GROUP_ID, PRODUCT_ID, { ...basePayload(), attributes: '500g' }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('rechaza precio negativo con VALIDATION_ERROR 400', async () => {
    await expect(create(GROUP_ID, PRODUCT_ID, { ...basePayload(), sale_price: -5 }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('rechaza min_stock no entero con VALIDATION_ERROR 400', async () => {
    await expect(create(GROUP_ID, PRODUCT_ID, { ...basePayload(), min_stock: 1.5 }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.create).not.toHaveBeenCalled()
  })
})

describe('getAll', () => {
  it('lanza NOT_FOUND si el producto no existe en el grupo', async () => {
    await expect(getAll(GROUP_ID, 99)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.findByProduct).not.toHaveBeenCalled()
  })

  it('devuelve las variantes del producto', async () => {
    repo.findByProduct.mockResolvedValueOnce([{ id: 11 }])
    expect(await getAll(GROUP_ID, PRODUCT_ID)).toEqual([{ id: 11 }])
    expect(repo.findByProduct).toHaveBeenCalledWith(GROUP_ID, PRODUCT_ID)
  })
})

describe('update/remove', () => {
  it('lanza NOT_FOUND si la variante no existe', async () => {
    await expect(update(GROUP_ID, PRODUCT_ID, 99, basePayload()))
      .rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('lanza NOT_FOUND si la variante es de otro producto (nunca FORBIDDEN)', async () => {
    repo.findById.mockResolvedValueOnce({ id: 11, product_id: 42, sku: 'OTRO' })
    await expect(update(GROUP_ID, PRODUCT_ID, 11, basePayload()))
      .rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('lanza NOT_FOUND si el producto de la URL no existe en el grupo', async () => {
    await expect(update(GROUP_ID, 99, 11, basePayload()))
      .rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('remove lanza NOT_FOUND ante mismatch de producto', async () => {
    repo.findById.mockResolvedValueOnce({ id: 11, product_id: 42, sku: 'OTRO' })
    await expect(remove(GROUP_ID, PRODUCT_ID, 11))
      .rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.remove).not.toHaveBeenCalled()
  })

  it('actualiza cuando producto y variante coinciden', async () => {
    await update(GROUP_ID, PRODUCT_ID, 11, basePayload())
    expect(repo.update).toHaveBeenCalledWith(11, expect.objectContaining({ sku: 'YERBA-001-500G' }))
  })
})
