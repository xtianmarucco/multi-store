const repo = require('../repositories/categories.repository')
const { createError } = require('../utils/handleError')
const { requiredText, optionalText, optionalId } = require('../utils/parse')

const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/

const getAll = (groupId) => repo.findAll(groupId)

const getById = async (groupId, id) => {
  const category = await repo.findById(groupId, id)
  if (!category) throw createError('Categoría no encontrada', 'NOT_FOUND', 404)
  return category
}

const buildData = async (groupId, { name, color, parent_id }) => {
  const parentId = optionalId(parent_id, 'parent_id')
  if (parentId && !(await repo.findById(groupId, parentId)))
    throw createError('La categoría padre no existe', 'VALIDATION_ERROR', 400)

  const normalizedColor = optionalText(color)
  if (normalizedColor && !COLOR_REGEX.test(normalizedColor))
    throw createError('color debe tener formato #rrggbb', 'VALIDATION_ERROR', 400)

  return { name: requiredText(name, 'name'), color: normalizedColor, parent_id: parentId }
}

// El nombre duplicado por grupo lo rechaza el @@unique([group_id, name]):
// Prisma lanza P2002 y handleError lo mapea a DUPLICATE 409 (igual que labels).
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

// Evita ciclos: el nuevo padre no puede ser la categoría ni uno de sus descendientes.
const assertNotDescendant = async (id, newParentId) => {
  let current = newParentId
  while (current) {
    if (current === id)
      throw createError('Una categoría no puede estar dentro de sí misma', 'VALIDATION_ERROR', 400)
    current = await repo.findParentId(current)
  }
}

module.exports = { getAll, getById, create, update, remove }
