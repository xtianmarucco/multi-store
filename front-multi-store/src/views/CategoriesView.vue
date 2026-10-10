<template>
  <DashboardLayout>
    <div class="space-y-5">
      <PageHeader title="Categorías" subtitle="Para clasificar los productos del catálogo">
        <button
          class="bg-[#1479FF] hover:bg-[#0f66e0] text-white font-medium px-5 py-2 rounded-full text-sm transition-colors"
          @click="openCreate"
        >
          + Nueva categoría
        </button>
      </PageHeader>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table class="min-w-full text-sm text-left">
          <thead class="border-b border-gray-100">
            <tr>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Categoría</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr v-for="i in 3" :key="`sk-${i}`" class="border-b border-gray-50">
                <td class="px-6 py-4"><SkeletonBlock width="150px" height="20px" rounded="999px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="100px" height="15px" /></td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="category in catalogStore.categoryTree"
                :key="category.id"
                class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <span class="text-[#193B68]">
                    {{ '— '.repeat(category.depth) }}
                  </span>
                  <span
                    class="inline-block h-2.5 w-2.5 rounded-full mr-2"
                    :style="{ backgroundColor: category.color ?? '#1479FF' }"
                  ></span>
                  <span class="font-medium text-[#193B68]">{{ category.name }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-3">
                    <button class="text-sm text-[#1479FF] hover:underline font-medium" @click="openEdit(category)">Editar</button>
                    <button class="text-sm text-red-500 hover:underline font-medium" @click="deleteTarget = category">Eliminar</button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-if="!loading && catalogStore.categories.length === 0" class="text-center py-10 text-gray-400 text-sm">
          No hay categorías registradas
        </div>
      </div>
    </div>

    <AppModal
      :open="showModal"
      :title="editTarget ? 'Editar categoría' : 'Nueva categoría'"
      :confirm-label="editTarget ? 'Guardar cambios' : 'Crear categoría'"
      :loading="saving"
      @close="showModal = false"
      @confirm="submitForm"
    >
      <div class="space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[#193B68]">Nombre <span class="text-red-500">*</span></label>
          <input v-model="form.name" type="text" placeholder="Ej: Indumentaria" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[#193B68]">Color</label>
          <div class="flex items-center gap-3">
            <input v-model="form.color" type="color" class="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1" />
            <span class="text-sm text-gray-500">{{ form.color }}</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[#193B68]">Categoría padre</label>
          <select v-model="form.parent_id" :class="inputClass">
            <option :value="null">Sin padre (raíz)</option>
            <option
              v-for="category in parentOptions"
              :key="category.id"
              :value="category.id"
            >
              {{ '— '.repeat(category.depth) }}{{ category.name }}
            </option>
          </select>
        </div>
        <p v-if="formError" class="text-xs text-red-500">{{ formError }}</p>
      </div>
    </AppModal>

    <AppModal
      :open="!!deleteTarget"
      title="Eliminar categoría"
      confirm-label="Eliminar"
      danger
      :loading="deleting"
      @close="deleteTarget = null"
      @confirm="doDelete"
    >
      <p class="text-sm text-gray-500">
        ¿Seguro que querés eliminar <strong class="text-[#193B68]">{{ deleteTarget?.name }}</strong>?
        Los productos de esta categoría quedarán sin categoría.
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
import { createCategory, deleteCategory, updateCategory } from '../services/CategoriesService'
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
const form = ref({ name: '', color: DEFAULT_COLOR, parent_id: null })

// La categoría editada (y nadie) no puede ser su propio padre.
const parentOptions = computed(() =>
  editTarget.value
    ? catalogStore.categoryTree.filter(c => c.id !== editTarget.value.id)
    : catalogStore.categoryTree
)

const fetchCategories = async () => {
  try {
    await catalogStore.fetchCategories()
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudieron cargar las categorías'), 'error')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editTarget.value = null
  form.value = { name: '', color: DEFAULT_COLOR, parent_id: null }
  formError.value = ''
  showModal.value = true
}

const openEdit = (category) => {
  editTarget.value = category
  form.value = {
    name: category.name,
    color: category.color ?? DEFAULT_COLOR,
    parent_id: category.parent_id ?? null
  }
  formError.value = ''
  showModal.value = true
}

const submitForm = async () => {
  formError.value = ''
  saving.value = true
  try {
    if (editTarget.value) {
      await updateCategory(editTarget.value.id, form.value)
      toast.add('Categoría actualizada')
    } else {
      await createCategory(form.value)
      toast.add('Categoría creada')
    }
    showModal.value = false
    await catalogStore.fetchCategories()
  } catch (err) {
    formError.value = errorMessage(err, 'No se pudo guardar la categoría')
  } finally {
    saving.value = false
  }
}

const doDelete = async () => {
  deleting.value = true
  try {
    await deleteCategory(deleteTarget.value.id)
    toast.add('Categoría eliminada')
    deleteTarget.value = null
    await catalogStore.fetchCategories()
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudo eliminar la categoría'), 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(fetchCategories)
</script>
