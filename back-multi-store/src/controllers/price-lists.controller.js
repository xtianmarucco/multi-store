const service = require('../services/price-lists.service')
const { handleError } = require('../utils/handleError')
const { parseId } = require('../utils/parse')

const getAllPriceLists = async (req, res) => {
  try {
    const data = await service.getAll(req.session.groupId)
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const getPriceListById = async (req, res) => {
  try {
    const data = await service.getById(req.session.groupId, parseId(req.params.id))
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const createPriceList = async (req, res) => {
  try {
    const data = await service.create(req.session.groupId, req.body ?? {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const updatePriceList = async (req, res) => {
  try {
    const data = await service.update(req.session.groupId, parseId(req.params.id), req.body ?? {})
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const deletePriceList = async (req, res) => {
  try {
    await service.remove(req.session.groupId, parseId(req.params.id))
    res.json({ success: true })
  } catch (err) {
    handleError(res, err)
  }
}

const getListPrices = async (req, res) => {
  try {
    const data = await service.getPrices(req.session.groupId, parseId(req.params.id))
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const createListPrice = async (req, res) => {
  try {
    const data = await service.setPrice(req.session.groupId, parseId(req.params.id), req.body ?? {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const updateListPrice = async (req, res) => {
  try {
    const data = await service.updatePrice(
      req.session.groupId, parseId(req.params.id), parseId(req.params.priceId), req.body ?? {})
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const deleteListPrice = async (req, res) => {
  try {
    await service.removePrice(req.session.groupId, parseId(req.params.id), parseId(req.params.priceId))
    res.json({ success: true })
  } catch (err) {
    handleError(res, err)
  }
}

module.exports = {
  getAllPriceLists, getPriceListById, createPriceList, updatePriceList, deletePriceList,
  getListPrices, createListPrice, updateListPrice, deleteListPrice
}
