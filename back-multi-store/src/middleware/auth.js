const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } })
  }
  next()
}

const requireAdmin = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } })
  }
  if (req.session?.role !== 'admin') {
    return res.status(403).json({ success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } })
  }
  next()
}

module.exports = { requireAuth, requireAdmin }
