export const formatMoney = (value) =>
  value == null ? '—' : Number(value).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : '—'

// Valor para <input type="date"> a partir de un ISO string.
export const toDateInput = (value) => (value ? value.slice(0, 10) : '')

// Mensaje amigable a partir de un error de axios con el formato { success, error: { message } }.
export const errorMessage = (err, fallback = 'Ocurrió un error inesperado') =>
  err?.response?.data?.error?.message ?? fallback
