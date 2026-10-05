import apiClient from './apiClient'

export const getLabels = async () => {
  const res = await apiClient.get('/labels')
  return res.data.data
}

export const createLabel = async (data) => {
  const res = await apiClient.post('/labels', data)
  return res.data.data
}

export const updateLabel = async (id, data) => {
  const res = await apiClient.put(`/labels/${id}`, data)
  return res.data.data
}

export const deleteLabel = async (id) => {
  await apiClient.delete(`/labels/${id}`)
}
