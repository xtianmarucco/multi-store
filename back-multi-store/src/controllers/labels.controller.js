const service = require('../services/labels.service')
const { handleError } = require('../utils/handleError')
const { parseId } = require('../utils/parse')

const getAllLabels = async (req, res) => {
  try {
    const data = await service.getAll(req.session.groupId)
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const getLabelById = async (req, res) => {
  try {
    const data = await service.getById(req.session.groupId, parseId(req.params.id))
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const createLabel = async (req, res) => {
  try {
    const data = await service.create(req.session.groupId, req.body ?? {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const updateLabel = async (req, res) => {
  try {
    const data = await service.update(req.session.groupId, parseId(req.params.id), req.body ?? {})
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const deleteLabel = async (req, res) => {
  try {
    await service.remove(req.session.groupId, parseId(req.params.id))
    res.json({ success: true })
  } catch (err) {
    handleError(res, err)
  }
}

module.exports = { getAllLabels, getLabelById, createLabel, updateLabel, deleteLabel }
