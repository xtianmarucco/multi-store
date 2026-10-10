const express = require('express')
const router = express.Router()

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categories.controller')

router.get('/', getAllCategories)
router.post('/', createCategory)
router.get('/:id', getCategoryById)
router.put('/:id', updateCategory)
router.delete('/:id', deleteCategory)

module.exports = router
