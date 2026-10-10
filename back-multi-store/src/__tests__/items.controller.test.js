import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const service = require('../services/items.service')
const controller = require('../controllers/items.controller')

const GROUP_ID = 1

const mockRes = () => {
  const res = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res
}

const mockReq = (overrides = {}) => ({
  session: { groupId: GROUP_ID },
  params: {},
  query: {},
  body: {},
  ...overrides,
})

beforeEach(() => {
  vi.spyOn(service, 'getAll').mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 })
  vi.spyOn(service, 'getById').mockResolvedValue({ id: 10, name: 'Taladro' })
  vi.spyOn(service, 'create').mockResolvedValue({ id: 11 })
  vi.spyOn(service, 'update').mockResolvedValue({ id: 10 })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('items.controller read-only deprecation', () => {
  it('POST /items responde 410 con código GONE y no llama al servicio', async () => {
    const req = mockReq({ body: { name: 'Taladro' } })
    const res = mockRes()

    await controller.createItem(req, res)

    expect(service.create).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(410)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Los items están deprecated: usar /products', code: 'GONE' },
    })
  })

  it('PUT /items/:id responde 410 con código GONE y no llama al servicio', async () => {
    const req = mockReq({ params: { id: '10' }, body: { name: 'Taladro' } })
    const res = mockRes()

    await controller.updateItem(req, res)

    expect(service.update).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(410)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Los items están deprecated: usar /products', code: 'GONE' },
    })
  })

  it('GET /items sigue delegando al servicio', async () => {
    const req = mockReq({ query: { page: '1' } })
    const res = mockRes()

    await controller.getAllItems(req, res)

    expect(service.getAll).toHaveBeenCalledWith(GROUP_ID, { page: '1' })
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    })
  })

  it('GET /items/:id sigue delegando al servicio', async () => {
    const req = mockReq({ params: { id: '10' } })
    const res = mockRes()

    await controller.getItemById(req, res)

    expect(service.getById).toHaveBeenCalledWith(GROUP_ID, 10)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 10, name: 'Taladro' } })
  })
})
