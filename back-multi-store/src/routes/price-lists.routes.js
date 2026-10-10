const express = require('express')
const router = express.Router()

const {
  getAllPriceLists,
  getPriceListById,
  createPriceList,
  updatePriceList,
  deletePriceList,
  getListPrices,
  createListPrice,
  updateListPrice,
  deleteListPrice
} = require('../controllers/price-lists.controller')

router.get('/', getAllPriceLists)
router.post('/', createPriceList)
router.get('/:id', getPriceListById)
router.put('/:id', updatePriceList)
router.delete('/:id', deletePriceList)

router.get('/:id/prices', getListPrices)
router.post('/:id/prices', createListPrice)
router.put('/:id/prices/:priceId', updateListPrice)
router.delete('/:id/prices/:priceId', deleteListPrice)

module.exports = router
