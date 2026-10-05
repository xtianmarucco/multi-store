import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const repo = require('../repositories/locations.repository')
const { create, update, remove } = require('../services/locations.service')

const GROUP_ID = 1
// Árbol: 1 Casa > 2 Garaje > 3 Estantería
const tree = { 1: null, 2: 1, 3: 2 }

beforeEach(() => {
  vi.spyOn(repo, 'findById').mockImplementation(async (_groupId, id) => (id in tree ? { id } : null))
  vi.spyOn(repo, 'findParentId').mockImplementation(async (id) => tree[id] ?? null)
  vi.spyOn(repo, 'create').mockImplementation(async (data) => ({ id: 4, ...data }))
  vi.spyOn(repo, 'update').mockImplementation(async (id, data) => ({ id, ...data }))
  vi.spyOn(repo, 'remove').mockResolvedValue({})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('create', () => {
  it('crea la ubicación con parent_id', async () => {
    await create(GROUP_ID, { name: ' Estante ', parent_id: '2' })
    expect(repo.create).toHaveBeenCalledWith({ name: 'Estante', description: null, parent_id: 2, group_id: GROUP_ID })
  })

  it('lanza VALIDATION_ERROR si el padre no existe', async () => {
    await expect(create(GROUP_ID, { name: 'x', parent_id: 99 })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})

describe('update', () => {
  it('permite mover una ubicación a otra rama', async () => {
    await update(GROUP_ID, 3, { name: 'Estantería', parent_id: 1 })
    expect(repo.update).toHaveBeenCalledWith(3, { name: 'Estantería', description: null, parent_id: 1 })
  })

  it('impide que una ubicación sea su propio padre', async () => {
    await expect(update(GROUP_ID, 2, { name: 'Garaje', parent_id: 2 })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('impide mover una ubicación dentro de un descendiente', async () => {
    await expect(update(GROUP_ID, 1, { name: 'Casa', parent_id: 3 })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(repo.update).not.toHaveBeenCalled()
  })
})

describe('remove', () => {
  it('lanza NOT_FOUND si no existe', async () => {
    await expect(remove(GROUP_ID, 99)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })
})
