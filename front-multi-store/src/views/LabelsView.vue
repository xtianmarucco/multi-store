<template>
  <DashboardLayout>
    <div class="space-y-5">
      <PageHeader title="Etiquetas" subtitle="Para clasificar y filtrar items">
        <button
          class="bg-[#1479FF] hover:bg-[#0f66e0] text-white font-medium px-5 py-2 rounded-full text-sm transition-colors"
          @click="openCreate"
        >
          + Nueva etiqueta
        </button>
      </PageHeader>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table class="min-w-full text-sm text-left">
          <thead class="border-b border-gray-100">
            <tr>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Etiqueta</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Descripción</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Items</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr v-for="i in 3" :key="`sk-${i}`" class="border-b border-gray-50">
                <td class="px-6 py-4"><SkeletonBlock width="110px" height="20px" rounded="999px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="200px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="30px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="100px" height="15px" /></td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="label in catalogStore.labels"
                :key="label.id"
                class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4"><LabelBadge :label="label" /></td>
                <td class="px-6 py-4 text-gray-500">{{ label.description || '—' }}</td>
                <td class="px-6 py-4 text-right text-[#193B68]">{{ label.item_count }}</td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-3">
                    <button class="text-sm text-[#1479FF] hover:underline font-medium" @click="openEdit(label)">Editar</button>
                    <button class="text-sm text-red-500 hover:underline font-medium" @click="deleteTarget = label">Eliminar</button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-if="!loading && catalogStore.labels.length === 0" class="text-center py-10 text-gray-400 text-sm">
          No hay etiquetas registradas
        </div>
      </div>
    </div>

    <AppModal
      :open="showModal"
      :title="editTarget ? 'Editar etiqueta' : 'Nueva etiqueta'"
      :confirm-label="editTarget ? 'Guardar cambios' : 'Crear etiqueta'"
      :loading="saving"
      @close="showModal = false"
      @confirm="submitForm"
    >
      <div class="space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[#193B68]">Nombre <span class="text-red-500">*</span></label>
          <input v-model="form.name" type="text" placeholder="Ej: Herramientas" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[#193B68]">Color</label>
          <div class="flex items-center gap-3">
            <input v-model="form.color" type="color" class="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1" />
            <span class="text-sm text-gray-500">{{ form.color }}</span>
          </div>
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
      title="Eliminar etiqueta"
      confirm-label="Eliminar"
      danger
      :loading="deleting"
      @close="deleteTarget = null"
      @confirm="doDelete"
    >
      <p class="text-sm text-gray-500">
        ¿Seguro que querés eliminar <strong class="text-[#193B68]">{{ deleteTarget?.name }}</strong>?
        Se quitará de los items que la tengan.
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
import LabelBadge from '../components/ui/LabelBadge.vue'
import { createLabel, deleteLabel, updateLabel } from '../services/LabelsService'
import { useCatalogStore } from '../stores/catalogStore'
import { useToastStore } from '../stores/toastStore'
import { errorMessage } from '../utils/format'

const catalogStore = useCatalogStore()
const toast = useToastStore()

const inputClass = 'border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] bg-white focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent'
const DEFAULT_COLOR = '#1479ff'

const loading = ref(true)
const showModal = ref(false)
const editTarget = ref(null)
const deleteTarget = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')
const form = ref({ name: '', description: '', color: DEFAULT_COLOR })

const fetchLabels = async () => {
  try {
    await catalogStore.fetchLabels()
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudieron cargar las etiquetas'), 'error')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editTarget.value = null
  form.value = { name: '', description: '', color: DEFAULT_COLOR }
  formError.value = ''
  showModal.value = true
}

const openEdit = (label) => {
  editTarget.value = label
  form.value = { name: label.name, description: label.description ?? '', color: label.color ?? DEFAULT_COLOR }
  formError.value = ''
  showModal.value = true
}

const submitForm = async () => {
  formError.value = ''
  saving.value = true
  try {
    if (editTarget.value) {
      await updateLabel(editTarget.value.id, form.value)
      toast.add('Etiqueta actualizada')
    } else {
      await createLabel(form.value)
      toast.add('Etiqueta creada')
    }
    showModal.value = false
    await fetchLabels()
  } catch (err) {
    formError.value = errorMessage(err, 'No se pudo guardar la etiqueta')
  } finally {
    saving.value = false
  }
}

const doDelete = async () => {
  deleting.value = true
  try {
    await deleteLabel(deleteTarget.value.id)
    toast.add('Etiqueta eliminada')
    deleteTarget.value = null
    await fetchLabels()
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudo eliminar la etiqueta'), 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(fetchLabels)
</script>
