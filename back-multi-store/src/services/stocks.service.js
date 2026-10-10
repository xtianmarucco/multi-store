const repo = require('../repositories/stocks.repository')
const productsRepo = require('../repositories/products.repository')
const variantsRepo = require('../repositories/variants.repository')
const locationsRepo = require('../repositories/locations.repository')
const { createError } = require('../utils/handleError')
const { parseId, optionalId } = require('../utils/parse')

// Invariante de granularidad (documentado aquí porque Postgres trata NULL
// como distinto en el @@unique de stocks):
// - Las filas a nivel producto usan variant_id NULL.
// - Las filas de variante usan variant_id con valor.
// - Un producto CON variantes no puede mover stock a nivel producto:
//   todo movimiento debe ser por variante.

// El producto debe ser del grupo: otro grupo → NOT_FOUND (nunca FORBIDDEN).
const assertProduct = async (groupId, productId) => {
  const product = await productsRepo.findById(groupId, productId)
  if (!product) throw createError('Producto no encontrado', 'NOT_FOUND', 404)
  return product
}

// La variante debe pertenecer al producto (regla de propiedad T5):
// mismatch → NOT_FOUND (igual que variants.service getVariantOfProduct).
const assertVariant = async (groupId, productId, variantId) => {
  if (variantId == null) {
    if ((await repo.countVariants(groupId, productId)) > 0) {
      throw createError(
        'El producto tiene variantes: el movimiento debe ser por variante',
        'VALIDATION_ERROR',
        400
      )
    }
    return null
  }
  const variant = await variantsRepo.findById(groupId, variantId)
  if (!variant || variant.product_id !== productId)
    throw createError('Variante no encontrada', 'NOT_FOUND', 404)
  return variant
}

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

const parsePositiveInt = (value, fallback, field) => {
  if (value === undefined || value === '') return fallback
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1)
    throw createError(`${field} debe ser un entero positivo`, 'VALIDATION_ERROR', 400)
  return number
}

const assertLocation = async (groupId, locationId, field) => {
  const location = await locationsRepo.findById(groupId, locationId)
  if (!location) throw createError(`La ubicación (${field}) no existe`, 'VALIDATION_ERROR', 400)
  return location
}

const parseQuantity = (value, { allowZero = false } = {}) => {
  // Sin coerción: solo números reales o strings numéricos.
  // Number(true)===1 y Number(null)/Number('')===0 pasaban la validación
  // y un adjust con quantity null reseteaba el stock a 0.
  const quantity =
    typeof value === 'number' ? value
    : typeof value === 'string' && value.trim() !== '' ? Number(value)
    : NaN
  if (!Number.isInteger(quantity) || quantity < (allowZero ? 0 : 1))
    throw createError(
      `quantity debe ser un entero ${allowZero ? 'mayor o igual a 0' : 'positivo'}`,
      'VALIDATION_ERROR',
      400
    )
  return quantity
}

const optionalNote = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : null

// Valida propiedad + granularidad y normaliza ids. Devuelve el producto.
const resolveScope = async (groupId, { product_id, variant_id, location_id, from_location_id, to_location_id }) => {
  const productId = parseId(product_id, 'product_id')
  const product = await assertProduct(groupId, productId)
  const variantId = optionalId(variant_id, 'variant_id')
  await assertVariant(groupId, productId, variantId)
  if (location_id !== undefined) await assertLocation(groupId, parseId(location_id, 'location_id'), 'location_id')
  if (from_location_id !== undefined) await assertLocation(groupId, parseId(from_location_id, 'from_location_id'), 'from_location_id')
  if (to_location_id !== undefined) await assertLocation(groupId, parseId(to_location_id, 'to_location_id'), 'to_location_id')
  return { product, productId, variantId }
}

const list = async (groupId, query = {}) => {
  const page = parsePositiveInt(query.page, 1, 'page')
  const pageSize = Math.min(parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, 'pageSize'), MAX_PAGE_SIZE)
  const { rows, total } = await repo.findStocks(groupId, {
    product_id: query.product_id === undefined ? undefined : parseId(query.product_id, 'product_id'),
    location_id: query.location_id === undefined ? undefined : parseId(query.location_id, 'location_id')
  }, { page, pageSize })
  return { stocks: rows, total, page, pageSize }
}

const getStock = async (groupId, { product_id, variant_id, location_id }) => {
  const { productId, variantId } = await resolveScope(groupId, { product_id, variant_id, location_id })
  return repo.getStock(groupId, productId, variantId, parseId(location_id, 'location_id'))
}

// Fija stock absoluto y registra movimiento type adjust.
const adjust = async (groupId, userId, payload) => {
  const { productId, variantId } = await resolveScope(groupId, payload)
  const locationId = parseId(payload.location_id, 'location_id')
  const quantity = parseQuantity(payload.quantity, { allowZero: true })
  return repo.setStock({
    group_id: groupId, product_id: productId, variant_id: variantId,
    location_id: locationId, quantity, user_id: userId, type: 'adjust',
    note: optionalNote(payload.note)
  })
}

// Mueve cantidad entre ubicaciones: valida ubicaciones distintas,
// cantidad positiva y stock suficiente en origen (VALIDATION_ERROR 400).
// La escritura es una única llamada transaccional al repositorio.
const transfer = async (groupId, userId, payload) => {
  const { productId, variantId } = await resolveScope(groupId, payload)
  const fromId = parseId(payload.from_location_id, 'from_location_id')
  const toId = parseId(payload.to_location_id, 'to_location_id')
  if (fromId === toId)
    throw createError('Las ubicaciones de origen y destino deben ser distintas', 'VALIDATION_ERROR', 400)
  const quantity = parseQuantity(payload.quantity)
  const source = await repo.getStock(groupId, productId, variantId, fromId)
  if ((source?.quantity ?? 0) < quantity)
    throw createError('Stock insuficiente en la ubicación de origen', 'VALIDATION_ERROR', 400)
  return repo.transfer({
    group_id: groupId, product_id: productId, variant_id: variantId,
    from_location_id: fromId, to_location_id: toId, quantity,
    user_id: userId, note: optionalNote(payload.note)
  })
}

// Entrada de stock (helper para futuras ventas): suma cantidad.
const registerIn = async (groupId, userId, payload) => {
  const { productId, variantId } = await resolveScope(groupId, payload)
  const locationId = parseId(payload.location_id, 'location_id')
  const quantity = parseQuantity(payload.quantity)
  return repo.addStock({
    group_id: groupId, product_id: productId, variant_id: variantId,
    location_id: locationId, quantity, user_id: userId, type: 'in',
    note: optionalNote(payload.note)
  })
}

// Salida de stock (helper para futuras ventas): resta con control de suficiente.
const registerOut = async (groupId, userId, payload) => {
  const { productId, variantId } = await resolveScope(groupId, payload)
  const locationId = parseId(payload.location_id, 'location_id')
  const quantity = parseQuantity(payload.quantity)
  const current = await repo.getStock(groupId, productId, variantId, locationId)
  if ((current?.quantity ?? 0) < quantity)
    throw createError('Stock insuficiente en la ubicación', 'VALIDATION_ERROR', 400)
  return repo.addStock({
    group_id: groupId, product_id: productId, variant_id: variantId,
    location_id: locationId, quantity: -quantity, user_id: userId, type: 'out',
    note: optionalNote(payload.note)
  })
}

const listMovements = async (groupId, query = {}) => {
  const page = parsePositiveInt(query.page, 1, 'page')
  const pageSize = Math.min(parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, 'pageSize'), MAX_PAGE_SIZE)
  const { rows, total } = await repo.findMovements(groupId, {
    product_id: query.product_id === undefined ? undefined : parseId(query.product_id, 'product_id'),
    location_id: query.location_id === undefined ? undefined : parseId(query.location_id, 'location_id')
  }, { page, pageSize })
  return { movements: rows, total, page, pageSize }
}

module.exports = { list, getStock, adjust, transfer, registerIn, registerOut, listMovements }
