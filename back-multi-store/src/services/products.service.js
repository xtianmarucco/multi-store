const repo = require('../repositories/products.repository')
const categoriesRepo = require('../repositories/categories.repository')
const labelsRepo = require('../repositories/labels.repository')
const { createError } = require('../utils/handleError')
const { parseId, optionalId, requiredText, optionalText } = require('../utils/parse')

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const VALID_UNITS = ['unit', 'weight', 'pack']

const parsePositiveInt = (value, fallback, field) => {
  if (value === undefined || value === '') return fallback
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1)
    throw createError(`${field} debe ser un entero positivo`, 'VALIDATION_ERROR', 400)
  return number
}

const parseActive = (value) => {
  if (value === undefined || value === '' || value === 'true') return true
  if (value === 'false') return false
  if (value === 'all') return undefined
  throw createError('active debe ser true, false o all', 'VALIDATION_ERROR', 400)
}

const optionalMoney = (value, field) => {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0)
    throw createError(`${field} debe ser un número mayor o igual a 0`, 'VALIDATION_ERROR', 400)
  return number
}

const getAll = async (groupId, query = {}) => {
  const page = parsePositiveInt(query.page, 1, 'page')
  const pageSize = Math.min(parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, 'pageSize'), MAX_PAGE_SIZE)
  const filters = {
    search: optionalText(query.search),
    category_id: optionalId(query.category_id, 'category_id'),
    label_id: optionalId(query.label_id, 'label_id'),
    active: parseActive(query.active)
  }

  const { rows, total } = await repo.findPaginated(groupId, filters, { page, pageSize })
  return { products: rows, total, page, pageSize }
}

const getById = async (groupId, id) => {
  const product = await repo.findById(groupId, id)
  if (!product) throw createError('Producto no encontrado', 'NOT_FOUND', 404)
  return product
}

const buildData = async (groupId, payload) => {
  if (payload.unit !== undefined && !VALID_UNITS.includes(payload.unit))
    throw createError('unit debe ser unit, weight o pack', 'VALIDATION_ERROR', 400)

  const minStock = payload.min_stock === undefined || payload.min_stock === '' ? 0 : Number(payload.min_stock)
  if (!Number.isInteger(minStock) || minStock < 0)
    throw createError('min_stock debe ser un entero mayor o igual a 0', 'VALIDATION_ERROR', 400)

  if (payload.label_ids !== undefined && !Array.isArray(payload.label_ids))
    throw createError('label_ids debe ser un array', 'VALIDATION_ERROR', 400)
  const labelIds = [...new Set((payload.label_ids ?? []).map(id => parseId(id, 'label_ids')))]

  const categoryId = optionalId(payload.category_id, 'category_id')
  if (categoryId && !(await categoriesRepo.findById(groupId, categoryId)))
    throw createError('La categoría no existe', 'VALIDATION_ERROR', 400)
  if (labelIds.length && (await labelsRepo.countByIds(groupId, labelIds)) !== labelIds.length)
    throw createError('Alguna etiqueta no existe', 'VALIDATION_ERROR', 400)

  return {
    sku: requiredText(payload.sku, 'sku'),
    barcode: optionalText(payload.barcode),
    name: requiredText(payload.name, 'name'),
    description: optionalText(payload.description),
    brand: optionalText(payload.brand),
    unit: payload.unit ?? 'unit',
    cost_price: optionalMoney(payload.cost_price, 'cost_price'),
    sale_price: optionalMoney(payload.sale_price, 'sale_price'),
    tax_rate: optionalMoney(payload.tax_rate, 'tax_rate'),
    min_stock: minStock,
    active: payload.active === undefined ? true : payload.active === true,
    category_id: categoryId,
    label_ids: labelIds
  }
}

// El sku duplicado por grupo lo rechaza el @@unique([group_id, sku]):
// Prisma lanza P2002 y handleError lo mapea a DUPLICATE 409 (igual que categories).
const create = async (groupId, payload) => {
  const data = await buildData(groupId, payload)
  return repo.create({ ...data, group_id: groupId })
}

const update = async (groupId, id, payload) => {
  await getById(groupId, id)
  const data = await buildData(groupId, payload)
  return repo.update(id, data)
}

const remove = async (groupId, id) => {
  await getById(groupId, id)
  return repo.remove(id)
}

module.exports = { getAll, getById, create, update, remove }
