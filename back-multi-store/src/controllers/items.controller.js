const service = require('../services/items.service')
const { handleError } = require('../utils/handleError')
const { parseId } = require('../utils/parse')

const ITEMS_DEPRECATED_MESSAGE = 'Los items están deprecated: usar /products'

const buildGoneResponse = (res) =>
  res.status(410).json({ success: false, error: { message: ITEMS_DEPRECATED_MESSAGE, code: 'GONE' } })

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

// Items en solo-lectura: la escritura vive en /products. POST/PUT responden
// 410 GONE sin tocar el servicio para no crear ni modificar filas legacy.
const createItem = async (req, res) => {
  buildGoneResponse(res)
}

const updateItem = async (req, res) => {
  buildGoneResponse(res)
}

// DELETE se conserva a propósito: permite limpiar filas legacy de items
// ya migradas a productos sin reabrir la escritura.
const deleteItem = async (req, res) => {
  try {
    await service.remove(req.session.groupId, parseId(req.params.id))
    res.json({ success: true })
  } catch (err) {
    handleError(res, err)
  }
}

module.exports = { getAllItems, getItemById, createItem, updateItem, deleteItem }
