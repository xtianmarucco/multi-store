const service = require('../services/stocks.service')
const { handleError } = require('../utils/handleError')

const getStocks = async (req, res) => {
  try {
    const data = await service.list(req.session.groupId, req.query)
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const adjustStock = async (req, res) => {
  try {
    const data = await service.adjust(req.session.groupId, req.session.userId, req.body ?? {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const transferStock = async (req, res) => {
  try {
    const data = await service.transfer(req.session.groupId, req.session.userId, req.body ?? {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const stockIn = async (req, res) => {
  try {
    const data = await service.registerIn(req.session.groupId, req.session.userId, req.body ?? {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const stockOut = async (req, res) => {
  try {
    const data = await service.registerOut(req.session.groupId, req.session.userId, req.body ?? {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const getMovements = async (req, res) => {
  try {
    const data = await service.listMovements(req.session.groupId, req.query)
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

module.exports = { getStocks, adjustStock, transferStock, stockIn, stockOut, getMovements }
