<template>
  <DashboardLayout>
    <div class="space-y-5 max-w-3xl">
      <PageHeader :title="isEdit ? 'Editar producto' : 'Nuevo producto'" :subtitle="`Paso ${step} de 2`">
        <RouterLink to="/products" class="text-sm text-[#1479FF] hover:underline font-medium">← Volver a productos</RouterLink>
      </PageHeader>

      <!-- Indicador de pasos -->
      <div class="flex items-center gap-2 text-sm">
        <span
          class="px-3 py-1 rounded-full font-semibold"
          :class="step === 1 ? 'bg-[#1479FF] text-white' : 'bg-white text-[#193B68] border border-gray-200'"
        >
          1 · Datos básicos
        </span>
        <span class="text-gray-300">→</span>
        <span
          class="px-3 py-1 rounded-full font-semibold"
          :class="step === 2 ? 'bg-[#1479FF] text-white' : 'bg-white text-[#193B68] border border-gray-200'"
        >
          2 · Opcionales
        </span>
      </div>

      <div v-if="loading" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <SkeletonBlock v-for="i in 5" :key="i" height="38px" rounded="12px" />
      </div>

      <!-- Paso 1: datos básicos -->
      <form v-else-if="step === 1" class="space-y-5" @submit.prevent="saveStep1">
        <section class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Nombre <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" required placeholder="Ej: Remera básica" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">SKU <span class="text-red-500">*</span></label>
            <input v-model="form.sku" type="text" required placeholder="Ej: REM-001" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Categoría</label>
            <select v-model="form.category_id" :class="inputClass">
              <option :value="null">Sin categoría</option>
              <option v-for="category in catalogStore.categoryTree" :key="category.id" :value="category.id">
                {{ '— '.repeat(category.depth) }}{{ category.name }}
              </option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Marca</label>
            <input v-model="form.brand" type="text" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Unidad</label>
            <select v-model="form.unit" :class="inputClass">
              <option value="unit">Unidad</option>
              <option value="weight">Peso</option>
              <option value="pack">Pack</option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Stock mínimo</label>
            <input v-model.number="form.min_stock" type="number" min="0" step="1" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Costo</label>
            <input v-model="form.cost_price" type="number" min="0" step="0.01" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">Precio de venta</label>
            <input v-model="form.sale_price" type="number" min="0" step="0.01" :class="inputClass" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-[#193B68]">IVA %</label>
            <input v-model="form.tax_rate" type="number" min="0" step="0.01" placeholder="Ej: 21" :class="inputClass" />
          </div>
          <label class="flex items-center gap-2 text-sm text-[#193B68]">
            <input v-model="form.active" type="checkbox" class="h-4 w-4 accent-[#1479FF]" />
            Activo
          </label>
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

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <div class="flex justify-end gap-3">
          <RouterLink
            to="/products"
            class="border border-gray-200 bg-white text-[#193B68] font-medium px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </RouterLink>
          <button
            type="submit"
            :disabled="saving"
            class="bg-[#1479FF] hover:bg-[#0f66e0] text-white font-medium px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {{ saving ? 'Guardando...' : (isEdit ? 'Guardar y continuar →' : 'Crear y continuar →') }}
          </button>
        </div>
      </form>

      <!-- Paso 2: secciones opcionales, todas apagadas por defecto -->
      <div v-else class="space-y-4">
        <section class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <span class="text-sm font-bold text-[#193B68]">Variantes <span class="font-normal text-gray-400">(talle, color…)</span></span>
            <input v-model="showVariants" type="checkbox" class="h-5 w-5 accent-[#1479FF]" />
          </label>
          <div v-if="showVariants" class="mt-4 space-y-3">
            <div v-if="variants.length === 0" class="text-sm text-gray-400">Todavía no hay variantes para este producto.</div>
            <div
              v-for="variant in variants"
              :key="variant.id"
              class="flex items-center gap-2 text-sm text-[#193B68] border border-gray-100 rounded-xl px-3 py-2"
            >
              <span class="font-medium">{{ variant.sku }}</span>
              <span class="text-gray-400">{{ formatAttributes(variant.attributes) }}</span>
              <span class="ml-auto">{{ formatMoney(variant.sale_price) }}</span>
              <button type="button" class="text-red-500 hover:underline text-xs font-medium" @click="removeVariant(variant)">
                Quitar
              </button>
            </div>
            <div class="grid gap-2 sm:grid-cols-4">
              <input v-model="variantForm.sku" type="text" placeholder="SKU *" :class="inputClass" />
              <input v-model="variantForm.talle" type="text" placeholder="Talle" :class="inputClass" />
              <input v-model="variantForm.color" type="text" placeholder="Color" :class="inputClass" />
              <input v-model="variantForm.sale_price" type="number" min="0" step="0.01" placeholder="Precio" :class="inputClass" />
            </div>
            <button
              type="button"
              :disabled="savingVariant"
              class="text-sm text-[#1479FF] hover:underline font-medium disabled:opacity-50"
              @click="addVariant"
            >
              {{ savingVariant ? 'Agregando...' : '+ Agregar variante' }}
            </button>
          </div>
        </section>

        <section class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <span class="text-sm font-bold text-[#193B68]">Precio mayorista</span>
            <input v-model="showWholesale" type="checkbox" class="h-5 w-5 accent-[#1479FF]" />
          </label>
          <div v-if="showWholesale" class="mt-4 grid gap-2 sm:grid-cols-2 items-end">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-[#193B68]">Precio en lista Mayorista</label>
              <input v-model="wholesalePrice" type="number" min="0" step="0.01" placeholder="Ej: 8500" :class="inputClass" />
            </div>
            <button
              type="button"
              :disabled="savingWholesale"
              class="bg-white border border-gray-200 text-[#193B68] font-medium px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              @click="saveWholesale"
            >
              {{ savingWholesale ? 'Guardando...' : 'Guardar precio mayorista' }}
            </button>
          </div>
        </section>

        <section class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <span class="text-sm font-bold text-[#193B68]">Stock inicial por ubicación</span>
            <input v-model="showStock" type="checkbox" class="h-5 w-5 accent-[#1479FF]" />
          </label>
          <div v-if="showStock" class="mt-4 space-y-2">
            <div
              v-for="location in catalogStore.locations"
              :key="location.id"
              class="flex items-center gap-3 text-sm"
            >
              <span class="flex-1 text-[#193B68]">{{ location.name }}</span>
              <input
                v-model.number="stockByLocation[location.id]"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                class="border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#193B68] w-28 focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent"
              />
            </div>
            <button
              type="button"
              :disabled="savingStock"
              class="bg-white border border-gray-200 text-[#193B68] font-medium px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              @click="saveStock"
            >
              {{ savingStock ? 'Guardando...' : 'Guardar stock inicial' }}
            </button>
          </div>
        </section>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <div class="flex flex-wrap justify-between gap-3">
          <button
            v-if="isEdit"
            type="button"
            class="text-sm text-red-500 hover:underline font-medium"
            @click="showDelete = true"
          >
            Eliminar producto
          </button>
          <div class="ml-auto flex gap-3">
            <button
              type="button"
              class="border border-gray-200 bg-white text-[#193B68] font-medium px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              @click="step = 1"
            >
              ← Volver al paso 1
            </button>
            <button
              type="button"
              class="bg-[#1479FF] hover:bg-[#0f66e0] text-white font-medium px-5 py-2 rounded-xl text-sm transition-colors"
              @click="router.push('/products')"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </div>

    <AppModal
      :open="showDelete"
      title="Eliminar producto"
      confirm-label="Eliminar"
      danger
      :loading="deleting"
      @close="showDelete = false"
      @confirm="remove"
    >
      <p class="text-sm text-gray-500">
        ¿Seguro que querés eliminar <strong class="text-[#193B68]">{{ form.name }}</strong>?
        <span class="font-semibold text-red-600">No se puede deshacer.</span>
        Si solo ya no lo vendés, podés marcarlo como inactivo.
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
import {
  adjustStock,
  createListPrice,
  createPriceList,
  createProduct,
  createProductVariant,
  deleteProduct,
  deleteProductVariant,
  getPriceLists,
  getProductById,
  getProductVariants,
  updateProduct
} from '../services/ProductsService'
import { useCatalogStore } from '../stores/catalogStore'
import { useToastStore } from '../stores/toastStore'
import { errorMessage, formatMoney } from '../utils/format'

const props = defineProps({
  id: { type: Number, default: null }
})

const router = useRouter()
const catalogStore = useCatalogStore()
const toast = useToastStore()

const inputClass = 'border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] bg-white focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent'

const emptyForm = () => ({
  name: '',
  sku: '',
  category_id: null,
  brand: '',
  unit: 'unit',
  cost_price: '',
  sale_price: '',
  tax_rate: '',
  min_stock: 0,
  active: true,
  label_ids: []
})

const isEdit = computed(() => props.id !== null)
const form = ref(emptyForm())
const productId = ref(props.id)
const step = ref(1)
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const showDelete = ref(false)
const error = ref('')

// Paso 2: todo apagado por defecto (opt-in).
const showVariants = ref(false)
const showWholesale = ref(false)
const showStock = ref(false)
const variants = ref([])
const variantForm = ref({ sku: '', talle: '', color: '', sale_price: '' })
const savingVariant = ref(false)
const wholesalePrice = ref('')
const savingWholesale = ref(false)
const stockByLocation = ref({})
const savingStock = ref(false)

const toForm = (product) => ({
  name: product.name,
  sku: product.sku,
  category_id: product.category?.id ?? product.category_id ?? null,
  brand: product.brand ?? '',
  unit: product.unit ?? 'unit',
  cost_price: product.cost_price ?? '',
  sale_price: product.sale_price ?? '',
  tax_rate: product.tax_rate ?? '',
  min_stock: product.min_stock ?? 0,
  active: product.active ?? true,
  label_ids: (product.labels ?? []).map(label => label.id)
})

const toPayload = () => ({
  ...form.value,
  category_id: form.value.category_id,
  cost_price: form.value.cost_price === '' ? null : form.value.cost_price,
  sale_price: form.value.sale_price === '' ? null : form.value.sale_price,
  tax_rate: form.value.tax_rate === '' ? null : form.value.tax_rate
})

const toggleLabel = (id) => {
  const ids = form.value.label_ids
  form.value.label_ids = ids.includes(id) ? ids.filter(labelId => labelId !== id) : [...ids, id]
}

const formatAttributes = (attributes) => {
  if (!attributes || typeof attributes !== 'object') return ''
  return Object.entries(attributes).map(([key, value]) => `${key}: ${value}`).join(' · ')
}

// Paso 1: crea (o actualiza) el producto y avanza al paso 2.
const saveStep1 = async () => {
  error.value = ''
  saving.value = true
  try {
    if (isEdit.value) {
      await updateProduct(productId.value, toPayload())
      toast.add('Producto actualizado')
    } else {
      const created = await createProduct(toPayload())
      productId.value = created.id
      toast.add('Producto creado')
    }
    step.value = 2
  } catch (err) {
    error.value = errorMessage(err, 'No se pudo guardar el producto')
  } finally {
    saving.value = false
  }
}

const addVariant = async () => {
  error.value = ''
  savingVariant.value = true
  try {
    const attributes = {}
    if (variantForm.value.talle.trim()) attributes.talle = variantForm.value.talle.trim()
    if (variantForm.value.color.trim()) attributes.color = variantForm.value.color.trim()
    const created = await createProductVariant(productId.value, {
      sku: variantForm.value.sku,
      attributes: Object.keys(attributes).length ? attributes : null,
      sale_price: variantForm.value.sale_price === '' ? null : variantForm.value.sale_price
    })
    variants.value.push(created)
    variantForm.value = { sku: '', talle: '', color: '', sale_price: '' }
    toast.add('Variante agregada')
  } catch (err) {
    error.value = errorMessage(err, 'No se pudo agregar la variante')
  } finally {
    savingVariant.value = false
  }
}

const removeVariant = async (variant) => {
  try {
    await deleteProductVariant(productId.value, variant.id)
    variants.value = variants.value.filter(v => v.id !== variant.id)
    toast.add('Variante eliminada')
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudo eliminar la variante'), 'error')
  }
}

// Reusa la lista "Mayorista" si existe; si no, la crea.
const saveWholesale = async () => {
  error.value = ''
  savingWholesale.value = true
  try {
    const lists = await getPriceLists()
    let list = lists.find(l => l.name.toLowerCase() === 'mayorista')
    if (!list) list = await createPriceList({ name: 'Mayorista' })
    await createListPrice(list.id, { product_id: productId.value, price: wholesalePrice.value })
    wholesalePrice.value = ''
    toast.add('Precio mayorista guardado')
  } catch (err) {
    error.value = errorMessage(err, 'No se pudo guardar el precio mayorista')
  } finally {
    savingWholesale.value = false
  }
}

const saveStock = async () => {
  error.value = ''
  savingStock.value = true
  try {
    const entries = Object.entries(stockByLocation.value)
      .filter(([, qty]) => qty !== '' && qty != null && Number(qty) > 0)
    for (const [locationId, quantity] of entries) {
      await adjustStock({
        product_id: productId.value,
        location_id: Number(locationId),
        quantity: Number(quantity)
      })
    }
    toast.add('Stock inicial guardado')
  } catch (err) {
    error.value = errorMessage(err, 'No se pudo guardar el stock inicial')
  } finally {
    savingStock.value = false
  }
}

const remove = async () => {
  deleting.value = true
  try {
    await deleteProduct(productId.value)
    toast.add('Producto eliminado')
    router.push('/products')
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudo eliminar el producto'), 'error')
  } finally {
    deleting.value = false
    showDelete.value = false
  }
}

onMounted(async () => {
  try {
    const [product] = await Promise.all([
      isEdit.value ? getProductById(props.id) : null,
      catalogStore.fetchAll()
    ])
    if (product) {
      form.value = toForm(product)
      variants.value = await getProductVariants(props.id)
    }
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudo cargar el producto'), 'error')
    router.push('/products')
  } finally {
    loading.value = false
  }
})
</script>
