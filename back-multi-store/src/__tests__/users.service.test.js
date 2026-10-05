import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const repo = require('../repositories/users.repository')
const { create, update, remove } = require('../services/users.service')

const GROUP_ID = 1
const admin = { id: 1, full_name: 'Admin', email: 'admin@x.com', role: 'admin', group_id: GROUP_ID }
const member = { id: 2, full_name: 'Member', email: 'member@x.com', role: 'member', group_id: GROUP_ID }

beforeEach(() => {
  vi.spyOn(repo, 'findById').mockImplementation(async (_groupId, id) => [admin, member].find(u => u.id === id) ?? null)
  vi.spyOn(repo, 'findByEmail').mockResolvedValue(null)
  vi.spyOn(repo, 'countAdmins').mockResolvedValue(1)
  vi.spyOn(repo, 'create').mockImplementation(async (data) => ({ id: 3, ...data }))
  vi.spyOn(repo, 'update').mockImplementation(async (id, data) => ({ id, ...data }))
  vi.spyOn(repo, 'remove').mockResolvedValue({})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('create', () => {
  it('crea el usuario en el grupo con la contraseña hasheada', async () => {
    await create(GROUP_ID, { full_name: 'Ana', email: ' Ana@X.com ', password: '12345678' })
    const data = repo.create.mock.calls[0][0]
    expect(data).toMatchObject({ full_name: 'Ana', email: 'ana@x.com', role: 'member', group_id: GROUP_ID })
    expect(data.password_hash).toMatch(/^\$2[ab]\$/)
  })

  it('lanza DUPLICATE si el email ya existe', async () => {
    repo.findByEmail.mockResolvedValue(member)
    await expect(create(GROUP_ID, { full_name: 'x', email: 'member@x.com', password: '12345678' }))
      .rejects.toMatchObject({ code: 'DUPLICATE', status: 409 })
  })

  it('lanza VALIDATION_ERROR con un rol inválido', async () => {
    await expect(create(GROUP_ID, { full_name: 'x', email: 'x@x.com', password: '12345678', role: 'root' }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })
})

describe('update', () => {
  it('impide quitar el rol al último admin', async () => {
    await expect(update(GROUP_ID, 1, { full_name: 'Admin', role: 'member' }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('no cambia la contraseña si no viene en el payload', async () => {
    await update(GROUP_ID, 2, { full_name: 'Member', role: 'member' })
    expect(repo.update).toHaveBeenCalledWith(2, { full_name: 'Member', role: 'member' })
  })
})

describe('remove', () => {
  it('impide eliminar el propio usuario', async () => {
    await expect(remove(GROUP_ID, 1, 1)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('elimina a un miembro', async () => {
    await remove(GROUP_ID, 2, 1)
    expect(repo.remove).toHaveBeenCalledWith(2)
  })
})
