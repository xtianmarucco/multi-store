import apiClient from './apiClient'

export const getCategories = async () => {
  const res = await apiClient.get('/categories')
  return res.data.data
}

export const createCategory = async (data) => {
  const res = await apiClient.post('/categories', data)
  return res.data.data
}

export const updateCategory = async (id, data) => {
  const res = await apiClient.put(`/categories/${id}`, data)
  return res.data.data
}

export const deleteCategory = async (id) => {
  await apiClient.delete(`/categories/${id}`)
}
