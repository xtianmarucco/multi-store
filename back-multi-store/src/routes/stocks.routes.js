const express = require('express')

const {
  getStocks, adjustStock, transferStock, stockIn, stockOut, getMovements
} = require('../controllers/stocks.controller')

const stocksRouter = express.Router()

stocksRouter.get('/', getStocks)
stocksRouter.post('/adjust', adjustStock)
stocksRouter.post('/transfer', transferStock)
stocksRouter.post('/in', stockIn)
stocksRouter.post('/out', stockOut)

const stockMovementsRouter = express.Router()

stockMovementsRouter.get('/', getMovements)

module.exports = { stocksRouter, stockMovementsRouter }
