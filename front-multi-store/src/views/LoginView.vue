<template>
  <div class="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
      <h1 class="text-2xl font-bold text-[#193B68] mb-1">Multi Store</h1>
      <p class="text-sm text-gray-500 mb-8">Ingresá tus credenciales para continuar</p>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-[#193B68] mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent"
            placeholder="usuario@email.com"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-[#193B68] mb-1">Contraseña</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent"
            placeholder="Contraseña"
            required
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full bg-[#1479FF] text-white font-medium py-2 rounded-lg text-sm hover:bg-[#0f66e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ authStore.loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        ¿No tenés cuenta?
        <RouterLink to="/register" class="font-medium text-[#1479FF] hover:underline">Registrate</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { errorMessage } from '../utils/format'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')

const handleSubmit = async () => {
  error.value = ''
  try {
    await authStore.login(email.value, password.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = errorMessage(err, 'No se pudo iniciar sesión')
  }
}
</script>
