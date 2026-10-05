<template>
  <DashboardLayout>
    <form class="space-y-5 max-w-3xl" @submit.prevent="save">
      <PageHeader :title="isEdit ? 'Editar item' : 'Nuevo item'">
        <RouterLink to="/items" class="text-sm text-[#1479FF] hover:underline font-medium">← Volver a items</RouterLink>
      </PageHeader>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <SkeletonBlock v-for="i in 5" :key="i" height="38px" rounded="12px" />
      </div>

      <template v-else>
        <section class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5 sm:col-span-2">
            <label class="text-sm font-semibold text-[#193B68]">Nombre <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" required placeholder="Ej: Taladro percutor" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5 sm:col-span-2">
            <label class="text-sm font-semibold text-[#193B68]">Descripción</label>
            <textarea v-model="form.description" rows="2" :class="inputClass"></textarea>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Ubicación</label>
            <select v-model="form.location_id" :class="inputClass">
              <option :value="null">Sin ubicación</option>
              <option v-for="location in catalogStore.locationTree" :key="location.id" :value="location.id">
                {{ '— '.repeat(location.depth) }}{{ location.name }}
              </option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Cantidad</label>
            <input v-model.number="form.quantity" type="number" min="0" step="1" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5 sm:col-span-2">
            <label class="text-sm font-semibold text-[#193B68]">Etiquetas</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="label in catalogStore.labels"
                :key="label.id"
                type="button"
                class="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                :class="form.label_ids.includes(label.id)
                  ? 'bg-[#1479FF] border-[#1479FF] text-white'
                  : 'bg-white border-gray-200 text-[#193B68] hover:bg-gray-50'"
                @click="toggleLabel(label.id)"
              >
                {{ label.name }}
              </button>
              <p v-if="catalogStore.labels.length === 0" class="text-sm text-gray-400">
                Todavía no hay etiquetas. <RouterLink to="/labels" class="text-[#1479FF] hover:underline">Crear una</RouterLink>
              </p>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid gap-4 sm:grid-cols-3">
          <h2 class="sm:col-span-3 text-sm font-bold text-[#193B68] uppercase tracking-wide">Detalles</h2>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Marca</label>
            <input v-model="form.manufacturer" type="text" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Modelo</label>
            <input v-model="form.model_number" type="text" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">N° de serie</label>
            <input v-model="form.serial_number" type="text" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Precio de compra</label>
            <input v-model="form.purchase_price" type="number" min="0" step="0.01" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Fecha de compra</label>
            <input v-model="form.purchase_date" type="date" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Garantía hasta</label>
            <input v-model="form.warranty_expires" type="date" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5 sm:col-span-3">
            <label class="text-sm font-semibold text-[#193B68]">Notas</label>
            <textarea v-model="form.notes" rows="3" :class="inputClass"></textarea>
          </div>
          <label class="flex items-center gap-2 text-sm text-[#193B68]">
            <input v-model="form.is_archived" type="checkbox" class="h-4 w-4 accent-[#1479FF]" />
            Archivado
          </label>
        </section>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <div class="flex flex-wrap justify-between gap-3">
          <button
            v-if="isEdit"
            type="button"
            class="text-sm text-red-500 hover:underline font-medium"
            @click="showDelete = true"
          >
            Eliminar item
          </button>
          <div class="ml-auto flex gap-3">
            <RouterLink
              to="/items"
              class="border border-gray-200 bg-white text-[#193B68] font-medium px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </RouterLink>
            <button
              type="submit"
              :disabled="saving"
              class="bg-[#1479FF] hover:bg-[#0f66e0] text-white font-medium px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {{ saving ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Crear item') }}
            </button>
          </div>
        </div>
      </template>
    </form>

    <AppModal
      :open="showDelete"
      title="Eliminar item"
      confirm-label="Eliminar"
      danger
      :loading="deleting"
      @close="showDelete = false"
      @confirm="remove"
    >
      <p class="text-sm text-gray-500">
        ¿Seguro que querés eliminar <strong class="text-[#193B68]">{{ form.name }}</strong>?
        <span class="font-semibold text-red-600">No se puede deshacer.</span>
        Si solo ya no lo usás, podés marcarlo como archivado.
      </p>
    </AppModal>
  </DashboardLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import PageHeader from '../components/ui/PageHeader.vue'
import SkeletonBlock from '../components/ui/SkeletonBlock.vue'
import AppModal from '../components/ui/AppModal.vue'
import { createItem, deleteItem, getItemById, updateItem } from '../services/ItemsService'
import { useCatalogStore } from '../stores/catalogStore'
import { useToastStore } from '../stores/toastStore'
import { errorMessage, toDateInput } from '../utils/format'

const props = defineProps({
  id: { type: Number, default: null }
})

const router = useRouter()
const catalogStore = useCatalogStore()
const toast = useToastStore()

const inputClass = 'border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] bg-white focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent'

const emptyForm = () => ({
  name: '',
  description: '',
  location_id: null,
  quantity: 1,
  label_ids: [],
  manufacturer: '',
  model_number: '',
  serial_number: '',
  purchase_price: '',
  purchase_date: '',
  warranty_expires: '',
  notes: '',
  is_archived: false
})

const isEdit = computed(() => props.id !== null)
const form = ref(emptyForm())
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const showDelete = ref(false)
const error = ref('')

const toForm = (item) => ({
  name: item.name,
  description: item.description ?? '',
  location_id: item.location?.id ?? null,
  quantity: item.quantity,
  label_ids: item.labels.map(label => label.id),
  manufacturer: item.manufacturer ?? '',
  model_number: item.model_number ?? '',
  serial_number: item.serial_number ?? '',
  purchase_price: item.purchase_price ?? '',
  purchase_date: toDateInput(item.purchase_date),
  warranty_expires: toDateInput(item.warranty_expires),
  notes: item.notes ?? '',
  is_archived: item.is_archived
})

const toggleLabel = (id) => {
  const ids = form.value.label_ids
  form.value.label_ids = ids.includes(id) ? ids.filter(labelId => labelId !== id) : [...ids, id]
}

const save = async () => {
  error.value = ''
  saving.value = true
  try {
    if (isEdit.value) {
      await updateItem(props.id, form.value)
      toast.add('Item actualizado')
    } else {
      await createItem(form.value)
      toast.add('Item creado')
    }
    router.push('/items')
  } catch (err) {
    error.value = errorMessage(err, 'No se pudo guardar el item')
  } finally {
    saving.value = false
  }
}

const remove = async () => {
  deleting.value = true
  try {
    await deleteItem(props.id)
    toast.add('Item eliminado')
    router.push('/items')
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudo eliminar el item'), 'error')
  } finally {
    deleting.value = false
    showDelete.value = false
  }
}

onMounted(async () => {
  try {
    const [item] = await Promise.all([
      isEdit.value ? getItemById(props.id) : null,
      catalogStore.fetchAll()
    ])
    if (item) form.value = toForm(item)
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudo cargar el item'), 'error')
    router.push('/items')
  } finally {
    loading.value = false
  }
})
</script>
