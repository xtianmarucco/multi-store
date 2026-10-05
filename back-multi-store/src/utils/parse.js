const { createError } = require('./handleError')

// Helpers de validación/normalización de input usados por los services.

const parseId = (value, field = 'id') => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw createError(`${field} inválido`, 'VALIDATION_ERROR', 400)
  return id
}

const optionalId = (value, field) =>
  value === undefined || value === null || value === '' ? null : parseId(value, field)

const requiredText = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError(`${field} es obligatorio`, 'VALIDATION_ERROR', 400)
  }
  return value.trim()
}

const optionalText = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null)

// Acepta YYYY-MM-DD (api-contract: fechas ISO).
const optionalDate = (value, field) => {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(Date.parse(value))) {
    throw createError(`${field} debe tener formato YYYY-MM-DD`, 'VALIDATION_ERROR', 400)
  }
  return new Date(`${value}T00:00:00.000Z`)
}

module.exports = { parseId, optionalId, requiredText, optionalText, optionalDate }
