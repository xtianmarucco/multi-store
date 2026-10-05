<template>
  <DashboardLayout>
    <div class="space-y-5">
      <PageHeader title="Usuarios" subtitle="Personas con acceso a este grupo">
        <button
          class="bg-[#1479FF] hover:bg-[#0f66e0] text-white font-medium px-5 py-2 rounded-full text-sm transition-colors"
          @click="openCreate"
        >
          + Nuevo usuario
        </button>
      </PageHeader>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table class="min-w-full text-sm text-left">
          <thead class="border-b border-gray-100">
            <tr>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nombre</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rol</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr v-for="i in 3" :key="`sk-${i}`" class="border-b border-gray-50">
                <td class="px-6 py-4"><SkeletonBlock width="140px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="180px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="70px" height="20px" rounded="999px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="100px" height="15px" /></td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="user in users" :key="user.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 font-medium text-[#193B68]">
                  {{ user.full_name }}
                  <span v-if="user.id === authStore.user?.id" class="text-xs text-gray-400">(vos)</span>
                </td>
                <td class="px-6 py-4 text-gray-500">{{ user.email }}</td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    :class="user.role === 'admin' ? 'bg-blue-50 text-[#1479FF]' : 'bg-gray-100 text-gray-500'"
                  >
                    {{ user.role === 'admin' ? 'Administrador' : 'Colaborador' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-3">
                    <button class="text-sm text-[#1479FF] hover:underline font-medium" @click="openEdit(user)">Editar</button>
                    <button
                      v-if="user.id !== authStore.user?.id"
                      class="text-sm text-red-500 hover:underline font-medium"
                      @click="deleteTarget = user"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal
      :open="showModal"
      :title="editTarget ? 'Editar usuario' : 'Nuevo usuario'"
      :confirm-label="editTarget ? 'Guardar cambios' : 'Crear usuario'"
      :loading="saving"
      @close="showModal = false"
      @confirm="submitForm"
    >
      <div class="space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[#193B68]">Nombre <span class="text-red-500">*</span></label>
          <input v-model="form.full_name" type="text" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[#193B68]">Email <span class="text-red-500">*</span></label>
          <input v-model="form.email" type="email" :disabled="!!editTarget" :class="[inputClass, 'disabled:bg-gray-50 disabled:text-gray-400']" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[#193B68]">
            {{ editTarget ? 'Nueva contraseña (dejar vacío para no cambiarla)' : 'Contraseña' }}
            <span v-if="!editTarget" class="text-red-500">*</span>
          </label>
          <input v-model="form.password" type="password" autocomplete="new-password" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[#193B68]">Rol</label>
          <select v-model="form.role" :class="inputClass">
            <option value="member">Colaborador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <p v-if="formError" class="text-xs text-red-500">{{ formError }}</p>
      </div>
    </AppModal>

    <AppModal
      :open="!!deleteTarget"
      title="Eliminar usuario"
      confirm-label="Eliminar"
      danger
      :loading="deleting"
      @close="deleteTarget = null"
      @confirm="doDelete"
    >
      <p class="text-sm text-gray-500">
        ¿Seguro que querés eliminar a <strong class="text-[#193B68]">{{ deleteTarget?.full_name }}</strong>?
        Perderá el acceso al grupo.
      </p>
    </AppModal>
  </DashboardLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import PageHeader from '../components/ui/PageHeader.vue'
import SkeletonBlock from '../components/ui/SkeletonBlock.vue'
import AppModal from '../components/ui/AppModal.vue'
import { createUser, deleteUser, getUsers, updateUser } from '../services/UsersService'
import { useAuthStore } from '../stores/authStore'
import { useToastStore } from '../stores/toastStore'
import { errorMessage } from '../utils/format'

const authStore = useAuthStore()
const toast = useToastStore()

const inputClass = 'border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] bg-white focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent'

const users = ref([])
const loading = ref(true)
const showModal = ref(false)
const editTarget = ref(null)
const deleteTarget = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')
const form = ref({ full_name: '', email: '', password: '', role: 'member' })

const fetchUsers = async () => {
  try {
    users.value = await getUsers()
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudieron cargar los usuarios'), 'error')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editTarget.value = null
  form.value = { full_name: '', email: '', password: '', role: 'member' }
  formError.value = ''
  showModal.value = true
}

const openEdit = (user) => {
  editTarget.value = user
  form.value = { full_name: user.full_name, email: user.email, password: '', role: user.role }
  formError.value = ''
  showModal.value = true
}

const submitForm = async () => {
  formError.value = ''
  saving.value = true
  try {
    if (editTarget.value) {
      const { full_name, role, password } = form.value
      await updateUser(editTarget.value.id, { full_name, role, ...(password && { password }) })
      toast.add('Usuario actualizado')
    } else {
      await createUser(form.value)
      toast.add('Usuario creado')
    }
    showModal.value = false
    await fetchUsers()
  } catch (err) {
    formError.value = errorMessage(err, 'No se pudo guardar el usuario')
  } finally {
    saving.value = false
  }
}

const doDelete = async () => {
  deleting.value = true
  try {
    await deleteUser(deleteTarget.value.id)
    toast.add('Usuario eliminado')
    deleteTarget.value = null
    await fetchUsers()
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudo eliminar el usuario'), 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(fetchUsers)
</script>
