import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const repo = require('../repositories/price-lists.repository')
const productsRepo = require('../repositories/products.repository')
const variantsRepo = require('../repositories/variants.repository')
const {
  getAll, getById, create, update, remove,
  getPrices, setPrice, updatePrice, removePrice, resolvePrice
} = require('../services/price-lists.service')

const GROUP_ID = 1
const LIST_ID = 5
const PRODUCT_ID = 7

const priceRow = (over = {}) => ({
  id: 21, price_list_id: LIST_ID, product_id: PRODUCT_ID, variant_id: null, price: 1800, ...over
})

beforeEach(() => {
  vi.spyOn(repo, 'findAll').mockResolvedValue([])
  vi.spyOn(repo, 'findById').mockImplementation(async (groupId, id) =>
    groupId === GROUP_ID && id === LIST_ID ? { id: LIST_ID, name: 'Minorista' } : null)
  vi.spyOn(repo, 'create').mockImplementation(async (data) => ({ id: LIST_ID, ...data }))
  vi.spyOn(repo, 'update').mockImplementation(async (id, data) => ({ id, ...data }))
  vi.spyOn(repo, 'remove').mockResolvedValue({})
  vi.spyOn(repo, 'findPrices').mockResolvedValue([])
  vi.spyOn(repo, 'findPrice').mockResolvedValue(null)
  vi.spyOn(repo, 'findPriceById').mockImplementation(async (listId, id) =>
    listId === LIST_ID && id === 21 ? priceRow() : null)
  vi.spyOn(repo, 'createPrice').mockImplementation(async (data) => ({ id: 21, ...data }))
  vi.spyOn(repo, 'updatePrice').mockImplementation(async (id, data) => ({ id, ...data }))
  vi.spyOn(repo, 'removePrice').mockResolvedValue({})
  vi.spyOn(productsRepo, 'findById').mockImplementation(async (groupId, id) =>
    groupId === GROUP_ID && id === PRODUCT_ID
      ? { id: PRODUCT_ID, sale_price: 1800 }
      : null)
  vi.spyOn(variantsRepo, 'findById').mockImplementation(async (groupId, id) =>
    groupId === GROUP_ID && id === 11
      ? { id: 11, product_id: PRODUCT_ID, sale_price: 950 }
      : null)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listas CRUD', () => {
  it('crea la lista con el group_id de la sesión', async () => {
    await create(GROUP_ID, { name: 'Mayorista' })
    expect(repo.create).toHaveBeenCalledWith({ name: 'Mayorista', group_id: GROUP_ID })
  })

  it('rechaza nombre faltante con VALIDATION_ERROR 400', async () => {
    await expect(create(GROUP_ID, {})).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('propaga nombre duplicado (P2002 → DUPLICATE 409 vía handleError)', async () => {
    const err = new Error('Unique constraint failed')
    err.code = 'P2002'
    repo.create.mockRejectedValueOnce(err)
    await expect(create(GROUP_ID, { name: 'Minorista' })).rejects.toMatchObject({ code: 'P2002' })
  })

  it('getById trata lista de otro grupo como inexistente', async () => {
    await expect(getById(2, LIST_ID)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })

  it('getAll filtra por el grupo de la sesión', async () => {
    await getAll(GROUP_ID)
    expect(repo.findAll).toHaveBeenCalledWith(GROUP_ID)
  })

  it('update lanza NOT_FOUND si no existe', async () => {
    await expect(update(GROUP_ID, 99, { name: 'X' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('remove lanza NOT_FOUND si no existe', async () => {
    await expect(remove(GROUP_ID, 99)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.remove).not.toHaveBeenCalled()
  })
})

describe('precios por lista', () => {
  it('getPrices lanza NOT_FOUND si la lista no es del grupo', async () => {
    await expect(getPrices(2, LIST_ID)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.findPrices).not.toHaveBeenCalled()
  })

  it('setPrice crea el precio validando lista y producto en el grupo', async () => {
    await setPrice(GROUP_ID, LIST_ID, { product_id: PRODUCT_ID, price: 1700 })
    expect(repo.createPrice).toHaveBeenCalledWith(expect.objectContaining({
      price_list_id: LIST_ID, product_id: PRODUCT_ID, price: 1700
    }))
  })

  it('setPrice rechaza precio negativo con VALIDATION_ERROR 400', async () => {
    await expect(setPrice(GROUP_ID, LIST_ID, { product_id: PRODUCT_ID, price: -1 }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.createPrice).not.toHaveBeenCalled()
  })

  it('setPrice lanza VALIDATION_ERROR si el producto no es del grupo', async () => {
    await expect(setPrice(GROUP_ID, LIST_ID, { product_id: 99, price: 10 }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.createPrice).not.toHaveBeenCalled()
  })

  it('setPrice lanza VALIDATION_ERROR si la variante no pertenece al producto', async () => {
    variantsRepo.findById.mockResolvedValueOnce({ id: 11, product_id: 42, sale_price: 1 })
    await expect(setPrice(GROUP_ID, LIST_ID, { product_id: PRODUCT_ID, variant_id: 11, price: 10 }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.createPrice).not.toHaveBeenCalled()
  })

  it('setPrice acepta variante del producto', async () => {
    await setPrice(GROUP_ID, LIST_ID, { product_id: PRODUCT_ID, variant_id: 11, price: 900 })
    expect(repo.createPrice).toHaveBeenCalledWith(expect.objectContaining({ variant_id: 11, price: 900 }))
  })

  it('updatePrice lanza NOT_FOUND si la fila no es de la lista', async () => {
    await expect(updatePrice(GROUP_ID, LIST_ID, 99, { price: 10 }))
      .rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.updatePrice).not.toHaveBeenCalled()
  })

  it('removePrice lanza NOT_FOUND si la fila no es de la lista', async () => {
    await expect(removePrice(GROUP_ID, LIST_ID, 99))
      .rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.removePrice).not.toHaveBeenCalled()
  })
})

describe('resolvePrice', () => {
  it('devuelve el precio de lista cuando existe', async () => {
    repo.findPrice.mockResolvedValueOnce(priceRow({ price: 1500 }))
    expect(await resolvePrice(GROUP_ID, PRODUCT_ID, null, LIST_ID)).toBe(1500)
  })

  it('cae a sale_price de la variante sin lista', async () => {
    expect(await resolvePrice(GROUP_ID, PRODUCT_ID, 11)).toBe(950)
  })

  it('cae a sale_price del producto sin variante ni lista', async () => {
    expect(await resolvePrice(GROUP_ID, PRODUCT_ID)).toBe(1800)
  })

  it('lista existente sin precio cae a variante y luego a producto', async () => {
    repo.findPrice.mockResolvedValueOnce(null)
    expect(await resolvePrice(GROUP_ID, PRODUCT_ID, 11, LIST_ID)).toBe(950)
    repo.findPrice.mockResolvedValueOnce(null)
    variantsRepo.findById.mockResolvedValueOnce(null)
    expect(await resolvePrice(GROUP_ID, PRODUCT_ID, 11, LIST_ID)).toBe(1800)
  })

  it('lanza NOT_FOUND si el producto no es del grupo', async () => {
    await expect(resolvePrice(2, PRODUCT_ID)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })
})
