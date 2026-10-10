const repo = require('../repositories/locations.repository')
const { createError } = require('../utils/handleError')
const { requiredText, optionalText, optionalId } = require('../utils/parse')

const getAll = (groupId, filter = {}) => repo.findAll(groupId, filter)

const getById = async (groupId, id) => {
  const location = await repo.findById(groupId, id)
  if (!location) throw createError('Ubicación no encontrada', 'NOT_FOUND', 404)
  return location
}

const LOCATION_TYPES = ['warehouse', 'store', 'other']

const parseType = (value) => {
  if (value === undefined || value === null || value === '') return 'other'
  if (!LOCATION_TYPES.includes(value))
    throw createError('type debe ser warehouse, store u other', 'VALIDATION_ERROR', 400)
  return value
}

const buildData = async (groupId, { name, description, parent_id, type, address, is_sale_point }) => {
  const parentId = optionalId(parent_id, 'parent_id')
  if (parentId && !(await repo.findById(groupId, parentId)))
    throw createError('La ubicación padre no existe', 'VALIDATION_ERROR', 400)

  return { name: requiredText(name, 'name'), description: optionalText(description), parent_id: parentId, type: parseType(type), address: optionalText(address), is_sale_point: is_sale_point === true }
}

const create = async (groupId, payload) => {
  const data = await buildData(groupId, payload)
  return repo.create({ ...data, group_id: groupId })
}

const update = async (groupId, id, payload) => {
  await getById(groupId, id)
  const data = await buildData(groupId, payload)
  if (data.parent_id) await assertNotDescendant(id, data.parent_id)
  return repo.update(id, data)
}

const remove = async (groupId, id) => {
  await getById(groupId, id)
  return repo.remove(id)
}

// Evita ciclos: el nuevo padre no puede ser la ubicación ni uno de sus descendientes.
const assertNotDescendant = async (id, newParentId) => {
  let current = newParentId
  while (current) {
    if (current === id)
      throw createError('Una ubicación no puede estar dentro de sí misma', 'VALIDATION_ERROR', 400)
    current = await repo.findParentId(current)
  }
}

module.exports = { getAll, getById, create, update, remove }
