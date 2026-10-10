const repo = require('../repositories/variants.repository')
const productsRepo = require('../repositories/products.repository')
const { createError } = require('../utils/handleError')
const { parseId, requiredText, optionalText } = require('../utils/parse')

const optionalMoney = (value, field) => {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0)
    throw createError(`${field} debe ser un número mayor o igual a 0`, 'VALIDATION_ERROR', 400)
  return number
}

const parseMinStock = (value) => {
  if (value === undefined || value === null || value === '') return 0
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0)
    throw createError('min_stock debe ser un entero mayor o igual a 0', 'VALIDATION_ERROR', 400)
  return number
}

const parseAttributes = (value) => {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'object' || Array.isArray(value))
    throw createError('attributes debe ser un objeto', 'VALIDATION_ERROR', 400)
  return value
}

const assertProductInGroup = async (groupId, productId) => {
  const product = await productsRepo.findById(groupId, productId)
  if (!product) throw createError('Producto no encontrado', 'NOT_FOUND', 404)
  return product
}

const buildData = (payload) => ({
  sku: requiredText(payload.sku, 'sku'),
  barcode: optionalText(payload.barcode),
  attributes: parseAttributes(payload.attributes),
  cost_price: optionalMoney(payload.cost_price, 'cost_price'),
  sale_price: optionalMoney(payload.sale_price, 'sale_price'),
  min_stock: parseMinStock(payload.min_stock),
  active: payload.active === undefined ? true : payload.active === true
})

const getAll = async (groupId, productId) => {
  await assertProductInGroup(groupId, productId)
  return repo.findByProduct(groupId, productId)
}

// La variante debe pertenecer al producto de la URL: mismatch → NOT_FOUND (nunca FORBIDDEN).
const getVariantOfProduct = async (groupId, productId, variantId) => {
  await assertProductInGroup(groupId, productId)
  const variant = await repo.findById(groupId, variantId)
  if (!variant || variant.product_id !== productId)
    throw createError('Variante no encontrada', 'NOT_FOUND', 404)
  return variant
}

// El sku duplicado por grupo lo rechaza el @@unique([group_id, sku]):
// Prisma lanza P2002 y handleError lo mapea a DUPLICATE 409 (igual que products).
const create = async (groupId, productId, payload) => {
  await assertProductInGroup(groupId, productId)
  const data = buildData(payload)
  return repo.create({ ...data, product_id: productId, group_id: groupId })
}

const update = async (groupId, productId, variantId, payload) => {
  await getVariantOfProduct(groupId, productId, variantId)
  return repo.update(variantId, buildData(payload))
}

const remove = async (groupId, productId, variantId) => {
  await getVariantOfProduct(groupId, productId, variantId)
  return repo.remove(variantId)
}

module.exports = { getAll, create, update, remove }
