import apiClient from './apiClient'

export const getStocks = async (params = {}) => {
  const res = await apiClient.get('/stocks', { params })
  return res.data.data
}

export const adjustStock = async (data) => {
  const res = await apiClient.post('/stocks/adjust', data)
  return res.data.data
}

export const transferStock = async (data) => {
  const res = await apiClient.post('/stocks/transfer', data)
  return res.data.data
}

export const getMovements = async (params = {}) => {
  const res = await apiClient.get('/stock-movements', { params })
  return res.data.data
}
