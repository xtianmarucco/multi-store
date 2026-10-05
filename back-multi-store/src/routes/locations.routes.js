const express = require('express')
const router = express.Router()

const {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
} = require('../controllers/locations.controller')

router.get('/', getAllLocations)
router.post('/', createLocation)
router.get('/:id', getLocationById)
router.put('/:id', updateLocation)
router.delete('/:id', deleteLocation)

module.exports = router
