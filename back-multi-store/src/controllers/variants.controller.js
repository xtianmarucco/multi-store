const service = require('../services/variants.service')
const { handleError } = require('../utils/handleError')
const { parseId } = require('../utils/parse')

const getAllVariants = async (req, res) => {
  try {
    const data = await service.getAll(req.session.groupId, parseId(req.params.id))
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const createVariant = async (req, res) => {
  try {
    const data = await service.create(req.session.groupId, parseId(req.params.id), req.body ?? {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const updateVariant = async (req, res) => {
  try {
    const data = await service.update(
      req.session.groupId, parseId(req.params.id), parseId(req.params.vid), req.body ?? {})
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const deleteVariant = async (req, res) => {
  try {
    await service.remove(req.session.groupId, parseId(req.params.id), parseId(req.params.vid))
    res.json({ success: true })
  } catch (err) {
    handleError(res, err)
  }
}

module.exports = { getAllVariants, createVariant, updateVariant, deleteVariant }
