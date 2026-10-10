import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const prisma = require('../lib/prisma')
const repo = require('../repositories/stocks.repository')
const productsRepo = require('../repositories/products.repository')
const variantsRepo = require('../repositories/variants.repository')
const locationsRepo = require('../repositories/locations.repository')
const {
  list, getStock, adjust, transfer, registerIn, registerOut, listMovements
} = require('../services/stocks.service')

const GROUP_ID = 1
const USER_ID = 9
const PRODUCT_ID = 7
const VARIANT_ID = 11
const FROM_ID = 3
const TO_ID = 4

beforeEach(() => {
  vi.spyOn(productsRepo, 'findById').mockImplementation(async (groupId, id) =>
    groupId === GROUP_ID && id === PRODUCT_ID
      ? { id: PRODUCT_ID, name: 'Taladro', cost_price: 100 }
      : null)
  vi.spyOn(variantsRepo, 'findById').mockImplementation(async (groupId, id) =>
    groupId === GROUP_ID && id === VARIANT_ID
      ? { id: VARIANT_ID, product_id: PRODUCT_ID, cost_price: 90 }
      : null)
  vi.spyOn(repo, 'countVariants').mockResolvedValue(0)
  vi.spyOn(locationsRepo, 'findById').mockImplementation(async (groupId, id) =>
    groupId === GROUP_ID && (id === FROM_ID || id === TO_ID)
      ? { id, name: `Loc ${id}` }
      : null)
  vi.spyOn(repo, 'getStock').mockResolvedValue(null)
  vi.spyOn(repo, 'findStocks').mockResolvedValue({ rows: [], total: 0 })
  vi.spyOn(repo, 'findMovements').mockResolvedValue({ rows: [], total: 0 })
  vi.spyOn(repo, 'setStock').mockImplementation(async (data) => ({ ...data }))
  vi.spyOn(repo, 'addStock').mockImplementation(async (data) => ({ ...data }))
  vi.spyOn(repo, 'transfer').mockImplementation(async (data) => ({ ...data }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('transferencia atómica', () => {
  it('delega en un único repo.transfer (decremento+incremento+movimiento atómicos)', async () => {
    repo.getStock.mockResolvedValueOnce({ quantity: 10 })
    await transfer(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, from_location_id: FROM_ID, to_location_id: TO_ID, quantity: 4
    })
    expect(repo.transfer).toHaveBeenCalledTimes(1)
    expect(repo.transfer).toHaveBeenCalledWith(expect.objectContaining({
      group_id: GROUP_ID, product_id: PRODUCT_ID, variant_id: null,
      from_location_id: FROM_ID, to_location_id: TO_ID, quantity: 4, user_id: USER_ID
    }))
    expect(repo.setStock).not.toHaveBeenCalled()
    expect(repo.addStock).not.toHaveBeenCalled()
  })

  it('rechaza stock insuficiente con VALIDATION_ERROR 400 sin tocar el repositorio transaccional', async () => {
    repo.getStock.mockResolvedValueOnce({ quantity: 2 })
    await expect(transfer(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, from_location_id: FROM_ID, to_location_id: TO_ID, quantity: 5
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.transfer).not.toHaveBeenCalled()
  })

  it('rechaza ubicaciones iguales con VALIDATION_ERROR 400', async () => {
    await expect(transfer(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, from_location_id: FROM_ID, to_location_id: FROM_ID, quantity: 1
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.transfer).not.toHaveBeenCalled()
  })

  it('rechaza cantidad no positiva con VALIDATION_ERROR 400', async () => {
    await expect(transfer(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, from_location_id: FROM_ID, to_location_id: TO_ID, quantity: 0
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
  })
})

describe('propiedad variante-producto (regla T5)', () => {
  it('lanza NOT_FOUND si la variante no pertenece al producto', async () => {
    variantsRepo.findById.mockResolvedValueOnce({ id: VARIANT_ID, product_id: 42, cost_price: 1 })
    await expect(adjust(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, variant_id: VARIANT_ID, location_id: FROM_ID, quantity: 3
    })).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(repo.setStock).not.toHaveBeenCalled()
  })

  it('lanza NOT_FOUND si el producto no es del grupo', async () => {
    await expect(adjust(GROUP_ID, USER_ID, {
      product_id: 99, location_id: FROM_ID, quantity: 3
    })).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })
})

describe('invariante de granularidad', () => {
  it('rechaza movimiento a nivel producto cuando el producto TIENE variantes', async () => {
    repo.countVariants.mockResolvedValueOnce(2)
    await expect(adjust(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, location_id: FROM_ID, quantity: 3
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.setStock).not.toHaveBeenCalled()
  })

  it('permite movimiento a nivel variante cuando el producto tiene variantes', async () => {
    repo.countVariants.mockResolvedValueOnce(2)
    await adjust(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, variant_id: VARIANT_ID, location_id: FROM_ID, quantity: 3
    })
    expect(repo.setStock).toHaveBeenCalledWith(expect.objectContaining({ variant_id: VARIANT_ID }))
  })
})

describe('adjust registra movimiento', () => {
  it('fija stock absoluto con type adjust y deja fila de movimiento', async () => {
    await adjust(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, location_id: FROM_ID, quantity: 8, note: 'conteo'
    })
    expect(repo.setStock).toHaveBeenCalledWith(expect.objectContaining({
      group_id: GROUP_ID, product_id: PRODUCT_ID, variant_id: null,
      location_id: FROM_ID, quantity: 8, user_id: USER_ID, type: 'adjust', note: 'conteo'
    }))
  })

  it('rechaza cantidad negativa con VALIDATION_ERROR 400', async () => {
    await expect(adjust(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, location_id: FROM_ID, quantity: -1
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.setStock).not.toHaveBeenCalled()
  })
})

describe('entradas y salidas (helpers para futuras ventas)', () => {
  it('registerIn suma con type in', async () => {
    await registerIn(GROUP_ID, USER_ID, { product_id: PRODUCT_ID, location_id: FROM_ID, quantity: 5 })
    expect(repo.addStock).toHaveBeenCalledWith(expect.objectContaining({ type: 'in', quantity: 5 }))
  })

  it('registerOut resta con type out y valida stock suficiente', async () => {
    repo.getStock.mockResolvedValueOnce({ quantity: 1 })
    await expect(registerOut(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, location_id: FROM_ID, quantity: 2
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.addStock).not.toHaveBeenCalled()
  })
})

describe('vistas', () => {
  it('getStock valida propiedad y delega al repositorio', async () => {
    repo.getStock.mockResolvedValueOnce({ quantity: 6 })
    const row = await getStock(GROUP_ID, { product_id: PRODUCT_ID, location_id: FROM_ID })
    expect(repo.getStock).toHaveBeenCalledWith(GROUP_ID, PRODUCT_ID, null, FROM_ID)
    expect(row).toEqual({ quantity: 6 })
  })

  it('list pagina por defecto y devuelve {stocks, total, page, pageSize}', async () => {
    repo.findStocks.mockResolvedValueOnce({ rows: [{ id: 1 }], total: 1 })
    const result = await list(GROUP_ID, { product_id: PRODUCT_ID })
    expect(repo.findStocks).toHaveBeenCalledWith(
      GROUP_ID,
      expect.objectContaining({ product_id: PRODUCT_ID }),
      { page: 1, pageSize: 20 }
    )
    expect(result).toEqual({ stocks: [{ id: 1 }], total: 1, page: 1, pageSize: 20 })
  })

  it('list limita pageSize a 100', async () => {
    await list(GROUP_ID, { page: '2', pageSize: '500' })
    expect(repo.findStocks).toHaveBeenCalledWith(GROUP_ID, expect.anything(), { page: 2, pageSize: 100 })
  })

  it('list rechaza page inválido con VALIDATION_ERROR 400', async () => {
    await expect(list(GROUP_ID, { page: '0' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.findStocks).not.toHaveBeenCalled()
  })

  it('listMovements pagina por defecto y devuelve {movements, total, page, pageSize}', async () => {
    repo.findMovements.mockResolvedValueOnce({ rows: [{ id: 2 }], total: 1 })
    const result = await listMovements(GROUP_ID, { location_id: FROM_ID })
    expect(repo.findMovements).toHaveBeenCalledWith(
      GROUP_ID,
      expect.objectContaining({ location_id: FROM_ID }),
      { page: 1, pageSize: 20 }
    )
    expect(result).toEqual({ movements: [{ id: 2 }], total: 1, page: 1, pageSize: 20 })
  })

  it('listMovements limita pageSize a 100', async () => {
    await listMovements(GROUP_ID, { page: '3', pageSize: '1000' })
    expect(repo.findMovements).toHaveBeenCalledWith(GROUP_ID, expect.anything(), { page: 3, pageSize: 100 })
  })
})

describe('parseQuantity estricto (sin coerción)', () => {
  it.each([true, false, null, ''])('adjust rechaza quantity=%j con VALIDATION_ERROR 400', async (quantity) => {
    await expect(adjust(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, location_id: FROM_ID, quantity
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.setStock).not.toHaveBeenCalled()
  })

  it('adjust rechaza quantity null sin resetear stock a 0', async () => {
    await expect(adjust(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, location_id: FROM_ID, quantity: null
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.setStock).not.toHaveBeenCalled()
  })

  it('adjust acepta strings numéricos', async () => {
    await adjust(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, location_id: FROM_ID, quantity: '8'
    })
    expect(repo.setStock).toHaveBeenCalledWith(expect.objectContaining({ quantity: 8 }))
  })

  it('registerOut rechaza quantity true con VALIDATION_ERROR 400', async () => {
    await expect(registerOut(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, location_id: FROM_ID, quantity: true
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(repo.addStock).not.toHaveBeenCalled()
  })
})

describe('guardia en-transacción contra sobregiro (carrera)', () => {
  it('addStock revalida dentro de la transacción y lanza VALIDATION_ERROR 400', async () => {
    repo.addStock.mockRestore()
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => cb({
      stocks: {
        findFirst: async () => ({ id: 1, quantity: 1 }),
        update: async () => { throw new Error('no debe actualizar con stock insuficiente') },
        create: async () => { throw new Error('no debe crear con stock insuficiente') }
      },
      stock_movements: { create: async () => { throw new Error('no debe registrar movimiento') } }
    }))
    await expect(repo.addStock({
      group_id: GROUP_ID, product_id: PRODUCT_ID, variant_id: null,
      location_id: FROM_ID, quantity: -5, user_id: USER_ID, type: 'out', note: null
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
  })

  it('registerOut propaga el VALIDATION_ERROR de la guardia en-transacción', async () => {
    repo.getStock.mockResolvedValueOnce({ quantity: 10 })
    repo.addStock.mockRejectedValueOnce(
      Object.assign(new Error('Stock insuficiente en la ubicación'), { code: 'VALIDATION_ERROR', status: 400 })
    )
    await expect(registerOut(GROUP_ID, USER_ID, {
      product_id: PRODUCT_ID, location_id: FROM_ID, quantity: 5
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
  })
})
