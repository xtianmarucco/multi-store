import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const repo = require('../repositories/items.repository')
const locationsRepo = require('../repositories/locations.repository')
const labelsRepo = require('../repositories/labels.repository')
const { getAll, getById, create, update, remove } = require('../services/items.service')

const GROUP_ID = 1
const mockItem = { id: 10, name: 'Taladro', quantity: 1, group_id: GROUP_ID }

beforeEach(() => {
  vi.spyOn(repo, 'findPaginated').mockResolvedValue({ rows: [mockItem], total: 1 })
  vi.spyOn(repo, 'findById').mockResolvedValue(null)
  vi.spyOn(repo, 'create').mockResolvedValue(mockItem)
  vi.spyOn(repo, 'update').mockResolvedValue(mockItem)
  vi.spyOn(repo, 'remove').mockResolvedValue(mockItem)
  vi.spyOn(locationsRepo, 'findById').mockResolvedValue({ id: 3 })
  vi.spyOn(labelsRepo, 'countByIds').mockImplementation(async (_groupId, ids) => ids.length)
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
describe('getAll', () => {
  it('aplica paginación y filtros por defecto', async () => {
    const result = await getAll(GROUP_ID, {})
    expect(repo.findPaginated).toHaveBeenCalledWith(
      GROUP_ID,
      { search: null, location_id: null, label_id: null, archived: false },
      { page: 1, pageSize: 20 }
    )
    expect(result).toEqual({ items: [mockItem], total: 1, page: 1, pageSize: 20 })
  })

  it('convierte los query params y limita pageSize a 100', async () => {
    await getAll(GROUP_ID, { search: ' bosch ', location_id: '3', archived: 'true', page: '2', pageSize: '500' })
    expect(repo.findPaginated).toHaveBeenCalledWith(
      GROUP_ID,
      { search: 'bosch', location_id: 3, label_id: null, archived: true },
      { page: 2, pageSize: 100 }
    )
  })

  it('lanza VALIDATION_ERROR si page no es válido', async () => {
    await expect(getAll(GROUP_ID, { page: '0' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
  })
})

// ---------------------------------------------------------------------------
describe('getById', () => {
  it('lanza NOT_FOUND si no existe en el grupo', async () => {
    await expect(getById(GROUP_ID, 99)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })
})

// ---------------------------------------------------------------------------
describe('create', () => {
  it('normaliza el payload antes de guardar', async () => {
    await create(GROUP_ID, {
      name: '  Taladro ',
      description: '',
      purchase_price: '89.9',
      purchase_date: '2024-03-10',
      location_id: 3,
      label_ids: [1, 1, 2]
    })
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Taladro',
      description: null,
      quantity: 1,
      purchase_price: 89.9,
      purchase_date: new Date('2024-03-10T00:00:00.000Z'),
      location_id: 3,
      label_ids: [1, 2],
      is_archived: false,
      group_id: GROUP_ID
    }))
  })

  it('lanza VALIDATION_ERROR si el nombre está vacío', async () => {
    await expect(create(GROUP_ID, { name: '  ' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('lanza VALIDATION_ERROR con cantidad negativa', async () => {
    await expect(create(GROUP_ID, { name: 'x', quantity: -1 })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('lanza VALIDATION_ERROR con una fecha mal formada', async () => {
    await expect(create(GROUP_ID, { name: 'x', purchase_date: '10/03/2024' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rechaza una ubicación de otro grupo', async () => {
    locationsRepo.findById.mockResolvedValue(null)
    await expect(create(GROUP_ID, { name: 'x', location_id: 3 })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(locationsRepo.findById).toHaveBeenCalledWith(GROUP_ID, 3)
  })

  it('rechaza etiquetas de otro grupo', async () => {
    labelsRepo.countByIds.mockResolvedValue(1)
    await expect(create(GROUP_ID, { name: 'x', label_ids: [1, 2] })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})

// ---------------------------------------------------------------------------
describe('update / remove', () => {
  it('update lanza NOT_FOUND si el item no existe', async () => {
    await expect(update(GROUP_ID, 99, { name: 'x' })).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('remove elimina el item si existe', async () => {
    repo.findById.mockResolvedValue(mockItem)
    await remove(GROUP_ID, 10)
    expect(repo.remove).toHaveBeenCalledWith(10)
  })
})
