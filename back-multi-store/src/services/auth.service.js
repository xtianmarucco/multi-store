const bcrypt = require('bcrypt')
const usersRepo = require('../repositories/users.repository')
const { createError } = require('../utils/handleError')
const { requiredText, optionalText } = require('../utils/parse')

const MIN_PASSWORD_LENGTH = 8

const normalizeEmail = (email) => requiredText(email, 'email').toLowerCase()

const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw createError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`, 'VALIDATION_ERROR', 400)
  }
}

const login = async (email, password) => {
  if (!email || !password)
    throw createError('Email and password are required', 'VALIDATION_ERROR', 400)

  const user = await usersRepo.findByEmail(normalizeEmail(email))
  if (!user) throw createError('Invalid credentials', 'UNAUTHORIZED', 401)

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) throw createError('Invalid credentials', 'UNAUTHORIZED', 401)

  return { id: user.id, email: user.email, full_name: user.full_name, role: user.role, group_id: user.group_id }
}

// Alta pública: crea un grupo nuevo con el usuario como admin.
const register = async ({ full_name, email, password, group_name }) => {
  const name = requiredText(full_name, 'full_name')
  const normalizedEmail = normalizeEmail(email)
  validatePassword(password)

  if (await usersRepo.findByEmail(normalizedEmail))
    throw createError('Ya existe un usuario con ese email', 'DUPLICATE', 409)

  return usersRepo.createWithGroup({
    full_name: name,
    email: normalizedEmail,
    password_hash: await bcrypt.hash(password, 10),
    group_name: optionalText(group_name) ?? `Grupo de ${name}`
  })
}

module.exports = { login, register, validatePassword, normalizeEmail }
