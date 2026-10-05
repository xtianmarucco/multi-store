const service = require('../services/items.service')
const { handleError } = require('../utils/handleError')
const { parseId } = require('../utils/parse')

const getAllItems = async (req, res) => {
  try {
    const data = await service.getAll(req.session.groupId, req.query)
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const getItemById = async (req, res) => {
  try {
    const data = await service.getById(req.session.groupId, parseId(req.params.id))
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const createItem = async (req, res) => {
  try {
    const data = await service.create(req.session.groupId, req.body ?? {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const updateItem = async (req, res) => {
  try {
    const data = await service.update(req.session.groupId, parseId(req.params.id), req.body ?? {})
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const deleteItem = async (req, res) => {
  try {
    await service.remove(req.session.groupId, parseId(req.params.id))
    res.json({ success: true })
  } catch (err) {
    handleError(res, err)
  }
}

module.exports = { getAllItems, getItemById, createItem, updateItem, deleteItem }
