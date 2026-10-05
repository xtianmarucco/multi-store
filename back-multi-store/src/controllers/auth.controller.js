const authService = require('../services/auth.service')
const { handleError } = require('../utils/handleError')

// Regenera la sesión al autenticarse (evita session fixation) y guarda los datos del usuario.
const startSession = (req, user) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err)
      req.session.userId = user.id
      req.session.groupId = user.group_id
      req.session.email = user.email
      req.session.fullName = user.full_name
      req.session.role = user.role
      resolve()
    })
  })

const login = async (req, res) => {
  try {
    const user = await authService.login(req.body?.email, req.body?.password)
    await startSession(req, user)
    res.json({ success: true, data: user })
  } catch (err) {
    handleError(res, err)
  }
}

const register = async (req, res) => {
  try {
    const user = await authService.register(req.body ?? {})
    await startSession(req, user)
    res.status(201).json({ success: true, data: user })
  } catch (err) {
    handleError(res, err)
  }
}

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ success: false, error: { message: 'Logout failed', code: 'INTERNAL_ERROR' } })
    res.clearCookie('connect.sid')
    res.json({ success: true, data: null })
  })
}

const me = (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.session.userId,
      email: req.session.email,
      full_name: req.session.fullName,
      role: req.session.role,
      group_id: req.session.groupId
    }
  })
}

module.exports = { login, register, logout, me }
