const express = require('express')
const router = express.Router()

const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
} = require('../controllers/items.controller')

router.get('/', getAllItems)
router.post('/', createItem)
router.get('/:id', getItemById)
router.put('/:id', updateItem)
router.delete('/:id', deleteItem)

module.exports = router
