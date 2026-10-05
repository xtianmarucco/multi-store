const express = require('express')
const router = express.Router()

const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/users.controller')
const { requireAdmin } = require('../middleware/auth')

router.get('/', requireAdmin, getAllUsers)
router.post('/', requireAdmin, createUser)
router.put('/:id', requireAdmin, updateUser)
router.delete('/:id', requireAdmin, deleteUser)

module.exports = router
