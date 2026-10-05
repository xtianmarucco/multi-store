<template>
  <DashboardLayout>
    <div class="space-y-5">
      <PageHeader title="Ubicaciones" subtitle="Lugares donde se guardan los items (pueden anidarse)">
        <button
          class="bg-[#1479FF] hover:bg-[#0f66e0] text-white font-medium px-5 py-2 rounded-full text-sm transition-colors"
          @click="openCreate()"
        >
          + Nueva ubicación
        </button>
      </PageHeader>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table class="min-w-full text-sm text-left">
          <thead class="border-b border-gray-100">
            <tr>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nombre</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Descripción</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Items</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="catalogStore.loading">
              <tr v-for="i in 4" :key="`sk-${i}`" class="border-b border-gray-50">
                <td class="px-6 py-4"><SkeletonBlock width="160px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="200px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="30px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="120px" height="15px" /></td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="location in catalogStore.locationTree"
                :key="location.id"
                class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 font-medium text-[#193B68]">
                  <span :style="{ paddingLeft: `${location.depth * 1.25}rem` }">
                    <span v-if="location.depth" class="text-gray-300">└ </span>{{ location.name }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-500">{{ location.description || '—' }}</td>
                <td class="px-6 py-4 text-right">
                  <RouterLink
                    class="text-[#1479FF] hover:underline"
                    :to="{ path: '/items' }"
                    @click="itemsStore.filters = { ...itemsStore.filters, location_id: String(location.id) }"
                  >
                    {{ location.item_count }}
                  </RouterLink>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-3 whitespace-nowrap">
                    <button class="text-sm text-[#1479FF] hover:underline font-medium" @click="openCreate(location.id)">+ Sub</button>
                    <button class="text-sm text-[#1479FF] hover:underline font-medium" @click="openEdit(location)">Editar</button>
                    <button class="text-sm text-red-500 hover:underline font-medium" @click="deleteTarget = location">Eliminar</button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-if="!catalogStore.loading && catalogStore.locations.length === 0" class="text-center py-10 text-gray-400 text-sm">
          No hay ubicaciones registradas
        </div>
      </div>
    </div>

    <AppModal
      :open="showModal"
      :title="editTarget ? 'Editar ubicación' : 'Nueva ubicación'"
      :confirm-label="editTarget ? 'Guardar cambios' : 'Crear ubicación'"
      :loading="saving"
      @close="showModal = false"
      @confirm="submitForm"
    >
      <div class="space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[#193B68]">Nombre <span class="text-red-500">*</span></label>
          <input v-model="form.name" type="text" placeholder="Ej: Garaje" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[#193B68]">Dentro de</label>
          <select v-model="form.parent_id" :class="inputClass">
            <option :value="null">— Ninguna (nivel superior) —</option>
            <option v-for="location in parentOptions" :key="location.id" :value="location.id">
              {{ '— '.repeat(location.depth) }}{{ location.name }}
            </option>
          </select>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[#193B68]">Descripción</label>
          <input v-model="form.description" type="text" :class="inputClass" />
        </div>
        <p v-if="formError" class="text-xs text-red-500">{{ formError }}</p>
      </div>
    </AppModal>

    <AppModal
      :open="!!deleteTarget"
      title="Eliminar ubicación"
      confirm-label="Eliminar"
      danger
      :loading="deleting"
      @close="deleteTarget = null"
      @confirm="doDelete"
    >
      <p class="text-sm text-gray-500">
        ¿Seguro que querés eliminar <strong class="text-[#193B68]">{{ deleteTarget?.name }}</strong>?
        Sus sububicaciones pasan al nivel superior y sus items quedan sin ubicación.
      </p>
    </AppModal>
  </DashboardLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import PageHeader from '../components/ui/PageHeader.vue'
import SkeletonBlock from '../components/ui/SkeletonBlock.vue'
import AppModal from '../components/ui/AppModal.vue'
import { createLocation, deleteLocation, updateLocation } from '../services/LocationsService'
import { useCatalogStore } from '../stores/catalogStore'
import { useItemsStore } from '../stores/itemsStore'
import { useToastStore } from '../stores/toastStore'
import { errorMessage } from '../utils/format'

const catalogStore = useCatalogStore()
const itemsStore = useItemsStore()
const toast = useToastStore()

const inputClass = 'border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] bg-white focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent'

const showModal = ref(false)
const editTarget = ref(null)
const deleteTarget = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')
const form = ref({ name: '', description: '', parent_id: null })

// Al editar, no se ofrece la propia ubicación como padre (el backend valida además los descendientes).
const parentOptions = computed(() =>
  catalogStore.locationTree.filter(location => location.id !== editTarget.value?.id)
)

const fetchLocations = async () => {
  try {
    catalogStore.loading = true
    await catalogStore.fetchLocations()
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudieron cargar las ubicaciones'), 'error')
  } finally {
    catalogStore.loading = false
  }
}

const openCreate = (parentId = null) => {
  editTarget.value = null
  form.value = { name: '', description: '', parent_id: parentId }
  formError.value = ''
  showModal.value = true
}

const openEdit = (location) => {
  editTarget.value = location
  form.value = { name: location.name, description: location.description ?? '', parent_id: location.parent_id }
  formError.value = ''
  showModal.value = true
}

const submitForm = async () => {
  formError.value = ''
  saving.value = true
  try {
    if (editTarget.value) {
      await updateLocation(editTarget.value.id, form.value)
      toast.add('Ubicación actualizada')
    } else {
      await createLocation(form.value)
      toast.add('Ubicación creada')
    }
    showModal.value = false
    await fetchLocations()
  } catch (err) {
    formError.value = errorMessage(err, 'No se pudo guardar la ubicación')
  } finally {
    saving.value = false
  }
}

const doDelete = async () => {
  deleting.value = true
  try {
    await deleteLocation(deleteTarget.value.id)
    toast.add('Ubicación eliminada')
    deleteTarget.value = null
    await fetchLocations()
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudo eliminar la ubicación'), 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(fetchLocations)
</script>
