const repo = require('../repositories/price-lists.repository')
const productsRepo = require('../repositories/products.repository')
const variantsRepo = require('../repositories/variants.repository')
const { createError } = require('../utils/handleError')
const { parseId, requiredText, optionalId } = require('../utils/parse')

const parsePrice = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0)
    throw createError('price debe ser un número mayor o igual a 0', 'VALIDATION_ERROR', 400)
  return number
}

const getAll = (groupId) => repo.findAll(groupId)

const getById = async (groupId, id) => {
  const list = await repo.findById(groupId, id)
  if (!list) throw createError('Lista de precios no encontrada', 'NOT_FOUND', 404)
  return list
}

// El nombre duplicado por grupo lo rechaza el @@unique([group_id, name]):
// Prisma lanza P2002 y handleError lo mapea a DUPLICATE 409 (igual que categories).
const create = async (groupId, payload) =>
  repo.create({ name: requiredText(payload.name, 'name'), group_id: groupId })

const update = async (groupId, id, payload) => {
  await getById(groupId, id)
  return repo.update(id, { name: requiredText(payload.name, 'name') })
}

const remove = async (groupId, id) => {
  await getById(groupId, id)
  return repo.remove(id)
}

const buildPriceData = async (groupId, priceListId, { product_id, variant_id, price }) => {
  const productId = parseId(product_id, 'product_id')
  const product = await productsRepo.findById(groupId, productId)
  if (!product) throw createError('El producto no existe', 'VALIDATION_ERROR', 400)

  const variantId = optionalId(variant_id, 'variant_id')
  if (variantId) {
    const variant = await variantsRepo.findById(groupId, variantId)
    if (!variant || variant.product_id !== productId)
      throw createError('La variante no pertenece al producto', 'VALIDATION_ERROR', 400)
  }

  return { price_list_id: priceListId, product_id: productId, variant_id: variantId, price: parsePrice(price) }
}

const getPrices = async (groupId, listId) => {
  await getById(groupId, listId)
  return repo.findPrices(listId)
}

const setPrice = async (groupId, listId, payload) => {
  await getById(groupId, listId)
  return repo.createPrice(await buildPriceData(groupId, listId, payload))
}

const updatePrice = async (groupId, listId, priceId, payload) => {
  await getById(groupId, listId)
  const row = await repo.findPriceById(listId, priceId)
  if (!row) throw createError('Precio no encontrado', 'NOT_FOUND', 404)
  return repo.updatePrice(priceId, { price: parsePrice(payload.price) })
}

const removePrice = async (groupId, listId, priceId) => {
  await getById(groupId, listId)
  const row = await repo.findPriceById(listId, priceId)
  if (!row) throw createError('Precio no encontrado', 'NOT_FOUND', 404)
  return repo.removePrice(priceId)
}

// Precio efectivo para T6: precio de lista → sale de variante → sale de producto.
const resolvePrice = async (groupId, productId, variantId = null, priceListId = null) => {
  const product = await productsRepo.findById(groupId, productId)
  if (!product) throw createError('Producto no encontrado', 'NOT_FOUND', 404)

  if (priceListId) {
    await getById(groupId, priceListId)
    const row = await repo.findPrice(priceListId, productId, variantId ?? null)
    if (row) return Number(row.price)
  }

  if (variantId) {
    const variant = await variantsRepo.findById(groupId, variantId)
    if (variant?.sale_price != null) return Number(variant.sale_price)
  }

  return product.sale_price != null ? Number(product.sale_price) : null
}

module.exports = {
  getAll, getById, create, update, remove,
  getPrices, setPrice, updatePrice, removePrice, resolvePrice
}
