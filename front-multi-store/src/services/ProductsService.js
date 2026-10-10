import apiClient from './apiClient'

export const getProducts = async (params = {}) => {
  const res = await apiClient.get('/products', { params })
  return res.data.data
}

export const getProductById = async (id) => {
  const res = await apiClient.get(`/products/${id}`)
  return res.data.data
}

export const createProduct = async (data) => {
  const res = await apiClient.post('/products', data)
  return res.data.data
}

export const updateProduct = async (id, data) => {
  const res = await apiClient.put(`/products/${id}`, data)
  return res.data.data
}

export const deleteProduct = async (id) => {
  await apiClient.delete(`/products/${id}`)
}

export const getProductVariants = async (productId) => {
  const res = await apiClient.get(`/products/${productId}/variants`)
  return res.data.data
}

export const createProductVariant = async (productId, data) => {
  const res = await apiClient.post(`/products/${productId}/variants`, data)
  return res.data.data
}

export const deleteProductVariant = async (productId, variantId) => {
  await apiClient.delete(`/products/${productId}/variants/${variantId}`)
}

export const getPriceLists = async () => {
  const res = await apiClient.get('/price-lists')
  return res.data.data
}

export const createPriceList = async (data) => {
  const res = await apiClient.post('/price-lists', data)
  return res.data.data
}

export const createListPrice = async (listId, data) => {
  const res = await apiClient.post(`/price-lists/${listId}/prices`, data)
  return res.data.data
}

export const adjustStock = async (data) => {
  const res = await apiClient.post('/stocks/adjust', data)
  return res.data.data
}
