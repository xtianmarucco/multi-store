const bcrypt = require('bcrypt')
const repo = require('../repositories/users.repository')
const { createError } = require('../utils/handleError')
const { requiredText } = require('../utils/parse')
const { validatePassword, normalizeEmail } = require('./auth.service')

const ROLES = ['admin', 'member']

const validateRole = (role) => {
  if (!ROLES.includes(role)) throw createError(`role debe ser ${ROLES.join(' o ')}`, 'VALIDATION_ERROR', 400)
  return role
}

const getAll = (groupId) => repo.findAll(groupId)

const getById = async (groupId, id) => {
  const user = await repo.findById(groupId, id)
  if (!user) throw createError('Usuario no encontrado', 'NOT_FOUND', 404)
  return user
}

const create = async (groupId, { full_name, email, password, role = 'member' }) => {
  const data = {
    full_name: requiredText(full_name, 'full_name'),
    email: normalizeEmail(email),
    role: validateRole(role),
    group_id: groupId
  }
  validatePassword(password)

  if (await repo.findByEmail(data.email))
    throw createError('Ya existe un usuario con ese email', 'DUPLICATE', 409)

  return repo.create({ ...data, password_hash: await bcrypt.hash(password, 10) })
}

// La contraseña solo se cambia si viene en el payload.
const update = async (groupId, id, { full_name, role, password }) => {
  const current = await getById(groupId, id)
  const data = { full_name: requiredText(full_name, 'full_name'), role: validateRole(role) }

  if (current.role === 'admin' && data.role !== 'admin') await assertNotLastAdmin(groupId)
  if (password) {
    validatePassword(password)
    data.password_hash = await bcrypt.hash(password, 10)
  }

  return repo.update(id, data)
}

const remove = async (groupId, id, currentUserId) => {
  const user = await getById(groupId, id)
  if (id === currentUserId) throw createError('No puedes eliminar tu propio usuario', 'VALIDATION_ERROR', 400)
  if (user.role === 'admin') await assertNotLastAdmin(groupId)
  return repo.remove(id)
}

const assertNotLastAdmin = async (groupId) => {
  if (await repo.countAdmins(groupId) <= 1)
    throw createError('El grupo debe tener al menos un administrador', 'VALIDATION_ERROR', 400)
}

module.exports = { getAll, getById, create, update, remove }
