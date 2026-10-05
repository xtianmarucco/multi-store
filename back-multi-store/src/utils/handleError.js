const { Prisma } = require('@prisma/client')

const handleError = (res, err) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: { message: 'Ya existe un registro con ese valor único', code: 'DUPLICATE' }
      })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: { message: 'Registro no encontrado', code: 'NOT_FOUND' }
      })
    }
    if (err.code === 'P2003') {
      return res.status(409).json({
        success: false,
        error: { message: 'Violación de referencia entre registros', code: 'CONFLICT' }
      })
    }
    console.error('[Prisma error]', err.code, err.meta)
    return res.status(500).json({
      success: false,
      error: { message: 'Database error', code: 'INTERNAL_ERROR' }
    })
  }

  // JSON mal formado en el body (lo lanza express.json()).
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: { message: 'JSON inválido', code: 'VALIDATION_ERROR' }
    })
  }

  const status = err.status || 500
  const code = status < 500 ? err.code || 'INTERNAL_ERROR' : 'INTERNAL_ERROR'
  const message = status < 500 ? err.message : 'Internal server error'

  if (status >= 500) console.error('[Server error]', err)

  res.status(status).json({
    success: false,
    error: { message, code, ...(err.data ? { data: err.data } : {}) }
  })
}

const createError = (message, code, status, data = null) => {
  const err = new Error(message)
  err.code = code
  err.status = status
  if (data) err.data = data
  return err
}

module.exports = { handleError, createError }
