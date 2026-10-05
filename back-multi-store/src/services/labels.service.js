const repo = require('../repositories/labels.repository')
const { createError } = require('../utils/handleError')
const { requiredText, optionalText } = require('../utils/parse')

const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/

const getAll = (groupId) => repo.findAll(groupId)

const getById = async (groupId, id) => {
  const label = await repo.findById(groupId, id)
  if (!label) throw createError('Etiqueta no encontrada', 'NOT_FOUND', 404)
  return label
}

const buildData = ({ name, description, color }) => {
  const normalizedColor = optionalText(color)
  if (normalizedColor && !COLOR_REGEX.test(normalizedColor))
    throw createError('color debe tener formato #rrggbb', 'VALIDATION_ERROR', 400)

  return { name: requiredText(name, 'name'), description: optionalText(description), color: normalizedColor }
}

const create = (groupId, payload) => repo.create({ ...buildData(payload), group_id: groupId })

const update = async (groupId, id, payload) => {
  await getById(groupId, id)
  return repo.update(id, buildData(payload))
}

const remove = async (groupId, id) => {
  await getById(groupId, id)
  return repo.remove(id)
}

module.exports = { getAll, getById, create, update, remove }
