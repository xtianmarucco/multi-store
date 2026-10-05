import apiClient from './apiClient'

export const getUsers = async () => {
  const res = await apiClient.get('/users')
  return res.data.data
}

export const createUser = async (data) => {
  const res = await apiClient.post('/users', data)
  return res.data.data
}

export const updateUser = async (id, data) => {
  const res = await apiClient.put(`/users/${id}`, data)
  return res.data.data
}

export const deleteUser = async (id) => {
  await apiClient.delete(`/users/${id}`)
}
