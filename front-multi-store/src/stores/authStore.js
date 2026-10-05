import { defineStore } from 'pinia'
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe } from '../services/AuthService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin'
  },

  actions: {
    async fetchMe() {
      try {
        this.user = await getMe()
      } catch {
        this.user = null
      }
    },

    async login(email, password) {
      this.loading = true
      try {
        this.user = await apiLogin(email, password)
      } finally {
        this.loading = false
      }
    },

    async register(payload) {
      this.loading = true
      try {
        this.user = await apiRegister(payload)
      } finally {
        this.loading = false
      }
    },

    async logout() {
      await apiLogout()
      this.user = null
    }
  }
})
