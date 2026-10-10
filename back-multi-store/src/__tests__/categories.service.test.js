import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const repo = require('../repositories/categories.repository')
const { create, update, remove, getAll, getById } = require('../services/categories.service')

const GROUP_ID = 1
const OTHER_GROUP = 2
// Árbol: 1 Almacén > 2 Bebidas > 3 Gaseosas
const tree = { 1: null, 2: 1, 3: 2 }

beforeEach(() => {
  vi.spyOn(repo, 'findById').mockImplementation(async (groupId, id) =>
    groupId === GROUP_ID && id in tree ? { id } : null)
  vi.spyOn(repo, 'findParentId').mockImplementation(async (id) => tree[id] ?? null)
  vi.spyOn(repo, 'create').mockImplementation(async (data) => ({ id: 4, ...data }))
  vi.spyOn(repo, 'update').mockImplementation(async (id, data) => ({ id, ...data }))
  vi.spyOn(repo, 'remove').mockResolvedValue({})
  vi.spyOn(repo, 'findAll').mockResolvedValue([])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('create', () => {
  it('crea la categoría con nombre y color', async () => {
    await create(GROUP_ID, { name: ' Lácteos ', color: '#ff0000' })
    expect(repo.create).toHaveBeenCalledWith({ name: 'Lácteos', color: '#ff0000', parent_id: null, group_id: GROUP_ID })
  })

  it('crea la categoría con parent_id', async () => {
    await create(GROUP_ID, { name: 'Vinos', parent_id: '2' })
    expect(repo.create).toHaveBeenCalledWith({ name: 'Vinos', color: null, parent_id: 2, group_id: GROUP_ID })
  })

  it('propaga el error de nombre duplicado (P2002 → DUPLICATE 409 vía handleError, como labels)', async () => {
    const err = new Error('Unique constraint failed')
    err.code = 'P2002'
    repo.create.mockRejectedValueOnce(err)
    await expect(create(GROUP_ID, { name: 'Bebidas' })).rejects.toMatchObject({ code: 'P2002' })
  })

  it('rechaza color inválido con VALIDATION_ERROR 400', async () => {
    await expect(create(GROUP_ID, { name: 'x', color: 'rojo' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('lanza VALIDATION_ERROR si el padre no existe', async () => {
    await expect(create(GROUP_ID, { name: 'x', parent_id: 99 })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('lanza VALIDATION_ERROR si el nombre falta', async () => {
    await expect(create(GROUP_ID, {})).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.create).not.toHaveBeenCalled()
  })
})

describe('update', () => {
  it('permite mover una categoría a otra rama', async () => {
    await update(GROUP_ID, 3, { name: 'Gaseosas', parent_id: 1 })
    expect(repo.update).toHaveBeenCalledWith(3, { name: 'Gaseosas', color: null, parent_id: 1 })
  })

  it('impide que una categoría sea su propio padre', async () => {
    await expect(update(GROUP_ID, 2, { name: 'Bebidas', parent_id: 2 })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('impide mover una categoría dentro de un descendiente', async () => {
    await expect(update(GROUP_ID, 1, { name: 'Almacén', parent_id: 3 })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('lanza NOT_FOUND si no existe', async () => {
    await expect(update(GROUP_ID, 99, { name: 'x' })).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })
})

describe('group scoping', () => {
  it('getAll filtra por el grupo de la sesión', async () => {
    await getAll(GROUP_ID)
    expect(repo.findAll).toHaveBeenCalledWith(GROUP_ID)
  })

  it('trata un recurso de otro grupo como inexistente', async () => {
    await expect(getById(OTHER_GROUP, 1)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })

  it('create guarda el group_id de la sesión', async () => {
    await create(GROUP_ID, { name: 'Panadería' })
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ group_id: GROUP_ID }))
  })
})

describe('remove', () => {
  it('lanza NOT_FOUND si no existe', async () => {
    await expect(remove(GROUP_ID, 99)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })
})
