import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const repo = require('../repositories/products.repository')
const categoriesRepo = require('../repositories/categories.repository')
const labelsRepo = require('../repositories/labels.repository')
const { create, update, remove, getAll, getById } = require('../services/products.service')

const GROUP_ID = 1
const OTHER_GROUP = 2

const basePayload = () => ({
  sku: 'YERBA-001',
  name: 'Yerba Mate 1kg',
  description: 'Elaborada',
  brand: 'Taragüí',
  unit: 'unit',
  cost_price: 1200.5,
  sale_price: 1800,
  tax_rate: 21,
  min_stock: 5,
  active: true,
  category_id: 3,
  label_ids: [1, 2]
})

beforeEach(() => {
  vi.spyOn(repo, 'findPaginated').mockResolvedValue({ rows: [], total: 0 })
  vi.spyOn(repo, 'findById').mockImplementation(async (groupId, id) =>
    groupId === GROUP_ID && id === 7 ? { id: 7, sku: 'YERBA-001' } : null)
  vi.spyOn(repo, 'create').mockImplementation(async (data) => ({ id: 8, ...data }))
  vi.spyOn(repo, 'update').mockImplementation(async (id, data) => ({ id, ...data }))
  vi.spyOn(repo, 'remove').mockResolvedValue({})
  vi.spyOn(categoriesRepo, 'findById').mockImplementation(async (groupId, id) =>
    groupId === GROUP_ID && id === 3 ? { id: 3 } : null)
  vi.spyOn(labelsRepo, 'countByIds').mockImplementation(async (groupId, ids) =>
    groupId === GROUP_ID ? ids.length : 0)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('create', () => {
  it('crea el producto con datos válidos', async () => {
    await create(GROUP_ID, basePayload())
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      sku: 'YERBA-001',
      name: 'Yerba Mate 1kg',
      group_id: GROUP_ID
    }))
  })

  it('propaga el error de sku duplicado (P2002 → DUPLICATE 409 vía handleError, como categories)', async () => {
    const err = new Error('Unique constraint failed')
    err.code = 'P2002'
    repo.create.mockRejectedValueOnce(err)
    await expect(create(GROUP_ID, basePayload())).rejects.toMatchObject({ code: 'P2002' })
  })

  it('rechaza unit inválida con VALIDATION_ERROR 400', async () => {
    await expect(create(GROUP_ID, { ...basePayload(), unit: 'litro' }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('rechaza precio negativo con VALIDATION_ERROR 400', async () => {
    await expect(create(GROUP_ID, { ...basePayload(), sale_price: -10 }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('lanza VALIDATION_ERROR si la categoría no existe en el grupo', async () => {
    await expect(create(GROUP_ID, { ...basePayload(), category_id: 99 }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('lanza VALIDATION_ERROR si el sku falta', async () => {
    const { sku, ...payload } = basePayload()
    await expect(create(GROUP_ID, payload)).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.create).not.toHaveBeenCalled()
  })
})

describe('getAll', () => {
  it('pasa filtros search/category/label/active al repositorio y devuelve {products, total, page, pageSize}', async () => {
    repo.findPaginated.mockResolvedValueOnce({ rows: [{ id: 1 }], total: 1 })
    const result = await getAll(GROUP_ID, { search: 'yerba', category_id: '3', label_id: '1', active: 'false', page: '1', pageSize: '20' })
    expect(repo.findPaginated).toHaveBeenCalledWith(GROUP_ID, {
      search: 'yerba',
      category_id: 3,
      label_id: 1,
      active: false
    }, { page: 1, pageSize: 20 })
    expect(result).toEqual({ products: [{ id: 1 }], total: 1, page: 1, pageSize: 20 })
  })

  it('filtra activos por defecto', async () => {
    await getAll(GROUP_ID, {})
    expect(repo.findPaginated).toHaveBeenCalledWith(GROUP_ID,
      expect.objectContaining({ active: true }), expect.anything())
  })

  it('active=all no filtra por estado', async () => {
    await getAll(GROUP_ID, { active: 'all' })
    expect(repo.findPaginated).toHaveBeenCalledWith(GROUP_ID,
      expect.objectContaining({ active: undefined }), expect.anything())
  })
})

describe('group scoping', () => {
  it('getById filtra por el grupo de la sesión', async () => {
    await getById(GROUP_ID, 7)
    expect(repo.findById).toHaveBeenCalledWith(GROUP_ID, 7)
  })

  it('trata un recurso de otro grupo como inexistente', async () => {
    await expect(getById(OTHER_GROUP, 7)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })

  it('create guarda el group_id de la sesión', async () => {
    await create(GROUP_ID, basePayload())
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ group_id: GROUP_ID }))
  })
})

describe('update/remove', () => {
  it('lanza NOT_FOUND si no existe', async () => {
    await expect(update(GROUP_ID, 99, basePayload())).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('remove lanza NOT_FOUND si no existe', async () => {
    await expect(remove(GROUP_ID, 99)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })
})
