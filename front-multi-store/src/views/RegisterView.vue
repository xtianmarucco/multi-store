<template>
  <div class="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
      <h1 class="text-2xl font-bold text-[#193B68] mb-1">Crear cuenta</h1>
      <p class="text-sm text-gray-500 mb-8">Se crea un grupo nuevo y vos quedás como administrador</p>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-for="field in fields" :key="field.key">
          <label class="block text-sm font-medium text-[#193B68] mb-1">{{ field.label }}</label>
          <input
            v-model="form[field.key]"
            :type="field.type ?? 'text'"
            :autocomplete="field.autocomplete"
            :placeholder="field.placeholder"
            :required="field.required"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full bg-[#1479FF] text-white font-medium py-2 rounded-lg text-sm hover:bg-[#0f66e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ authStore.loading ? 'Creando...' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        ¿Ya tenés cuenta?
        <RouterLink to="/login" class="font-medium text-[#1479FF] hover:underline">Ingresá</RouterLink>
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

const fields = [
  { key: 'full_name', label: 'Nombre', autocomplete: 'name', required: true },
  { key: 'email', label: 'Email', type: 'email', autocomplete: 'email', placeholder: 'usuario@email.com', required: true },
  { key: 'password', label: 'Contraseña (mín. 8 caracteres)', type: 'password', autocomplete: 'new-password', required: true },
  { key: 'group_name', label: 'Nombre del grupo (opcional)', placeholder: 'Ej: Mi casa' }
]

const form = ref({ full_name: '', email: '', password: '', group_name: '' })
const error = ref('')

const handleSubmit = async () => {
  error.value = ''
  try {
    await authStore.register(form.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = errorMessage(err, 'No se pudo crear la cuenta')
  }
}
</script>
