import apiClient from './apiClient'

export const getSummary = async () => {
  const res = await apiClient.get('/dashboard')
  return res.data.data
}
