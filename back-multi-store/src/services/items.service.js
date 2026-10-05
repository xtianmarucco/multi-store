const repo = require('../repositories/items.repository')
const locationsRepo = require('../repositories/locations.repository')
const labelsRepo = require('../repositories/labels.repository')
const { createError } = require('../utils/handleError')
const { parseId, optionalId, requiredText, optionalText, optionalDate } = require('../utils/parse')

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

const parsePositiveInt = (value, fallback, field) => {
  if (value === undefined || value === '') return fallback
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1)
    throw createError(`${field} debe ser un entero positivo`, 'VALIDATION_ERROR', 400)
  return number
}

const getAll = async (groupId, query = {}) => {
  const page = parsePositiveInt(query.page, 1, 'page')
  const pageSize = Math.min(parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, 'pageSize'), MAX_PAGE_SIZE)
  const filters = {
    search: optionalText(query.search),
    location_id: optionalId(query.location_id, 'location_id'),
    label_id: optionalId(query.label_id, 'label_id'),
    archived: query.archived === 'true'
  }

  const { rows, total } = await repo.findPaginated(groupId, filters, { page, pageSize })
  return { items: rows, total, page, pageSize }
}

const getById = async (groupId, id) => {
  const item = await repo.findById(groupId, id)
  if (!item) throw createError('Item no encontrado', 'NOT_FOUND', 404)
  return item
}

const buildData = async (groupId, payload) => {
  const quantity = payload.quantity === undefined ? 1 : Number(payload.quantity)
  if (!Number.isInteger(quantity) || quantity < 0)
    throw createError('quantity debe ser un entero mayor o igual a 0', 'VALIDATION_ERROR', 400)

  const hasPrice = payload.purchase_price !== undefined && payload.purchase_price !== null && payload.purchase_price !== ''
  const purchasePrice = hasPrice ? Number(payload.purchase_price) : null
  if (hasPrice && (!Number.isFinite(purchasePrice) || purchasePrice < 0))
    throw createError('purchase_price debe ser un número mayor o igual a 0', 'VALIDATION_ERROR', 400)

  if (payload.label_ids !== undefined && !Array.isArray(payload.label_ids))
    throw createError('label_ids debe ser un array', 'VALIDATION_ERROR', 400)
  const labelIds = [...new Set((payload.label_ids ?? []).map(id => parseId(id, 'label_ids')))]

  const locationId = optionalId(payload.location_id, 'location_id')
  if (locationId && !(await locationsRepo.findById(groupId, locationId)))
    throw createError('La ubicación no existe', 'VALIDATION_ERROR', 400)
  if (labelIds.length && (await labelsRepo.countByIds(groupId, labelIds)) !== labelIds.length)
    throw createError('Alguna etiqueta no existe', 'VALIDATION_ERROR', 400)

  return {
    name: requiredText(payload.name, 'name'),
    description: optionalText(payload.description),
    quantity,
    manufacturer: optionalText(payload.manufacturer),
    model_number: optionalText(payload.model_number),
    serial_number: optionalText(payload.serial_number),
    purchase_price: purchasePrice,
    purchase_date: optionalDate(payload.purchase_date, 'purchase_date'),
    warranty_expires: optionalDate(payload.warranty_expires, 'warranty_expires'),
    notes: optionalText(payload.notes),
    is_archived: payload.is_archived === true,
    location_id: locationId,
    label_ids: labelIds
  }
}

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
