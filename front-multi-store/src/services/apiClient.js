import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})

apiClient.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.error?.message || 'Unexpected error'
    console.error(`[API Error] ${err.config?.method?.toUpperCase()} ${err.config?.url} — ${message}`)
    return Promise.reject(err)
  }
)

export default apiClient
