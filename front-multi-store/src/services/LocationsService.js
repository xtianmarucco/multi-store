import apiClient from './apiClient'

export const getLocations = async () => {
  const res = await apiClient.get('/locations')
  return res.data.data
}

export const createLocation = async (data) => {
  const res = await apiClient.post('/locations', data)
  return res.data.data
}

export const updateLocation = async (id, data) => {
  const res = await apiClient.put(`/locations/${id}`, data)
  return res.data.data
}

export const deleteLocation = async (id) => {
  await apiClient.delete(`/locations/${id}`)
}
