import apiClient from './apiClient'

export const getItems = async (params = {}) => {
  const res = await apiClient.get('/items', { params })
  return res.data.data
}

export const getItemById = async (id) => {
  const res = await apiClient.get(`/items/${id}`)
  return res.data.data
}

export const createItem = async (data) => {
  const res = await apiClient.post('/items', data)
  return res.data.data
}

export const updateItem = async (id, data) => {
  const res = await apiClient.put(`/items/${id}`, data)
  return res.data.data
}

export const deleteItem = async (id) => {
  await apiClient.delete(`/items/${id}`)
}
