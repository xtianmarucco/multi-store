<template>
  <DashboardLayout>
    <div class="space-y-5">
      <PageHeader title="Productos" :subtitle="`${productsStore.total} resultado(s)`">
        <RouterLink
          to="/products/new"
          class="bg-[#1479FF] hover:bg-[#0f66e0] text-white font-medium px-5 py-2 rounded-full text-sm transition-colors"
        >
          + Nuevo producto
        </RouterLink>
      </PageHeader>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          v-model="search"
          type="search"
          placeholder="Buscar por nombre, marca, SKU o código…"
          class="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent sm:col-span-2 lg:col-span-1"
        />
        <select
          :value="productsStore.filters.category_id"
          class="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] bg-white focus:outline-none focus:ring-2 focus:ring-[#1479FF]"
          @change="productsStore.applyFilters({ category_id: $event.target.value })"
        >
          <option value="">Todas las categorías</option>
          <option v-for="category in catalogStore.categoryTree" :key="category.id" :value="category.id">
            {{ '— '.repeat(category.depth) }}{{ category.name }}
          </option>
        </select>
        <select
          :value="productsStore.filters.active"
          class="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] bg-white focus:outline-none focus:ring-2 focus:ring-[#1479FF]"
          @change="productsStore.applyFilters({ active: $event.target.value })"
        >
          <option value="all">Activos e inactivos</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table class="min-w-full text-sm text-left">
          <thead class="border-b border-gray-100">
            <tr>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nombre</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">SKU</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Categoría</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Precio</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="productsStore.loading">
              <tr v-for="i in 5" :key="`sk-${i}`" class="border-b border-gray-50">
                <td class="px-6 py-4"><SkeletonBlock width="180px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="100px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="80px" height="20px" rounded="999px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="70px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="60px" height="20px" rounded="999px" /></td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="product in productsStore.products"
                :key="product.id"
                class="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                @click="router.push(`/products/${product.id}`)"
              >
                <td class="px-6 py-4">
                  <p class="font-medium text-[#193B68]">{{ product.name }}</p>
                  <p v-if="product.brand" class="text-xs text-gray-400">{{ product.brand }}</p>
                </td>
                <td class="px-6 py-4 text-gray-500">{{ product.sku }}</td>
                <td class="px-6 py-4 text-gray-500">{{ product.category?.name ?? '—' }}</td>
                <td class="px-6 py-4 text-right text-[#193B68]">{{ formatMoney(product.sale_price) }}</td>
                <td class="px-6 py-4 text-right">
                  <span
                    class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                    :class="product.active ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'"
                  >
                    {{ product.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-if="!productsStore.loading && productsStore.products.length === 0" class="text-center py-10 text-gray-400 text-sm">
          No hay productos que coincidan con los filtros
        </div>
      </div>

      <div v-if="productsStore.totalPages > 1" class="flex items-center justify-end gap-3 text-sm text-[#193B68]">
        <button
          class="border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-40"
          :disabled="productsStore.page <= 1"
          @click="productsStore.goToPage(productsStore.page - 1)"
        >
          Anterior
        </button>
        <span>Página {{ productsStore.page }} de {{ productsStore.totalPages }}</span>
        <button
          class="border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-40"
          :disabled="productsStore.page >= productsStore.totalPages"
          @click="productsStore.goToPage(productsStore.page + 1)"
        >
          Siguiente
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import PageHeader from '../components/ui/PageHeader.vue'
import SkeletonBlock from '../components/ui/SkeletonBlock.vue'
import { useProductsStore } from '../stores/productsStore'
import { useCatalogStore } from '../stores/catalogStore'
import { useToastStore } from '../stores/toastStore'
import { errorMessage, formatMoney } from '../utils/format'

const router = useRouter()
const productsStore = useProductsStore()
const catalogStore = useCatalogStore()
const toast = useToastStore()

const search = ref(productsStore.filters.search)

const load = async (action) => {
  try {
    await action()
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudieron cargar los productos'), 'error')
  }
}

// Búsqueda con debounce para no disparar una request por tecla.
let searchTimer
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(() => productsStore.applyFilters({ search: value })), 300)
})
// Si se sale de la vista con una búsqueda pendiente, se conserva el último valor tipeado.
onBeforeUnmount(() => {
  clearTimeout(searchTimer)
  productsStore.filters.search = search.value
})

onMounted(() => {
  load(() => Promise.all([productsStore.fetchProducts(), catalogStore.fetchAll()]))
})
</script>
