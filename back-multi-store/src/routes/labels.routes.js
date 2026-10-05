const express = require('express')
const router = express.Router()

const {
  getAllLabels,
  getLabelById,
  createLabel,
  updateLabel,
  deleteLabel
} = require('../controllers/labels.controller')

router.get('/', getAllLabels)
router.post('/', createLabel)
router.get('/:id', getLabelById)
router.put('/:id', updateLabel)
router.delete('/:id', deleteLabel)

module.exports = router
