const express = require('express')
const router = express.Router()

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/products.controller')
const {
  getAllVariants,
  createVariant,
  updateVariant,
  deleteVariant
} = require('../controllers/variants.controller')

router.get('/', getAllProducts)
router.post('/', createProduct)
router.get('/:id', getProductById)
router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)

router.get('/:id/variants', getAllVariants)
router.post('/:id/variants', createVariant)
router.put('/:id/variants/:vid', updateVariant)
router.delete('/:id/variants/:vid', deleteVariant)

module.exports = router
