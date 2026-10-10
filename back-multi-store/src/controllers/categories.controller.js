const service = require('../services/categories.service')
const { handleError } = require('../utils/handleError')
const { parseId } = require('../utils/parse')

const getAllCategories = async (req, res) => {
  try {
    const data = await service.getAll(req.session.groupId)
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const getCategoryById = async (req, res) => {
  try {
    const data = await service.getById(req.session.groupId, parseId(req.params.id))
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const createCategory = async (req, res) => {
  try {
    const data = await service.create(req.session.groupId, req.body ?? {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const updateCategory = async (req, res) => {
  try {
    const data = await service.update(req.session.groupId, parseId(req.params.id), req.body ?? {})
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const deleteCategory = async (req, res) => {
  try {
    await service.remove(req.session.groupId, parseId(req.params.id))
    res.json({ success: true })
  } catch (err) {
    handleError(res, err)
  }
}

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory }
