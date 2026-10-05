const { Router } = require('express')
const { requireAuth } = require('../middleware/auth')

const authRoutes = require('./auth.routes')
const dashboardRoutes = require('./dashboard.routes')
const itemsRoutes = require('./items.routes')
const labelsRoutes = require('./labels.routes')
const locationsRoutes = require('./locations.routes')
const usersRoutes = require('./users.routes')

const router = Router()

router.use('/auth', authRoutes)
router.use('/dashboard', requireAuth, dashboardRoutes)
router.use('/items', requireAuth, itemsRoutes)
router.use('/labels', requireAuth, labelsRoutes)
router.use('/locations', requireAuth, locationsRoutes)
router.use('/users', requireAuth, usersRoutes)

module.exports = router
