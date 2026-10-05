const service = require('../services/users.service')
const { handleError } = require('../utils/handleError')
const { parseId } = require('../utils/parse')

const getAllUsers = async (req, res) => {
  try {
    const data = await service.getAll(req.session.groupId)
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const createUser = async (req, res) => {
  try {
    const data = await service.create(req.session.groupId, req.body ?? {})
    res.status(201).json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const updateUser = async (req, res) => {
  try {
    const data = await service.update(req.session.groupId, parseId(req.params.id), req.body ?? {})
    res.json({ success: true, data })
  } catch (err) {
    handleError(res, err)
  }
}

const deleteUser = async (req, res) => {
  try {
    await service.remove(req.session.groupId, parseId(req.params.id), req.session.userId)
    res.json({ success: true })
  } catch (err) {
    handleError(res, err)
  }
}

module.exports = { getAllUsers, createUser, updateUser, deleteUser }
