<template>
  <DashboardLayout>
    <div class="space-y-5">
      <PageHeader title="Stock por sucursal" :subtitle="`${stocksStore.total} registro(s)`" />

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid gap-3 sm:grid-cols-2">
        <select
          :value="stocksStore.filters.product_id"
          class="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] bg-white focus:outline-none focus:ring-2 focus:ring-[#1479FF]"
          @change="applyFilter({ product_id: $event.target.value })"
        >
          <option value="">Todos los productos</option>
          <option v-for="product in productsStore.products" :key="product.id" :value="product.id">
            {{ product.name }} ({{ product.sku }})
          </option>
        </select>
        <select
          :value="stocksStore.filters.location_id"
          class="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] bg-white focus:outline-none focus:ring-2 focus:ring-[#1479FF]"
          @change="applyFilter({ location_id: $event.target.value })"
        >
          <option value="">Depósito y locales</option>
          <option v-for="location in catalogStore.locations" :key="location.id" :value="location.id">
            {{ location.name }} — {{ typeLabel(location.type) }}
          </option>
        </select>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table class="min-w-full text-sm text-left">
          <thead class="border-b border-gray-100">
            <tr>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Producto</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Sucursal</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Cantidad</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="stocksStore.loading">
              <tr v-for="i in 5" :key="`sk-${i}`" class="border-b border-gray-50">
                <td class="px-6 py-4"><SkeletonBlock width="180px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="120px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="60px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="140px" height="30px" rounded="12px" /></td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="row in enrichedStocks"
                :key="row.id"
                class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4">
                  <p class="font-medium text-[#193B68]">{{ row.productName }}</p>
                  <p v-if="row.productSku" class="text-xs text-gray-400">{{ row.productSku }}</p>
                </td>
                <td class="px-6 py-4">
                  <p class="text-[#193B68]">{{ row.locationName }}</p>
                  <span class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1479FF]">
                    {{ typeLabel(row.locationType) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="font-bold text-[#193B68]">{{ row.quantity }}</span>
                  <span
                    v-if="row.isLow"
                    class="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626]"
                  >
                    Stock bajo
                  </span>
                </td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <button
                    class="border border-gray-200 bg-white px-3 py-1.5 rounded-xl text-xs font-medium text-[#193B68] hover:bg-gray-50 mr-2"
                    @click="openAdjust(row)"
                  >
                    Ajustar
                  </button>
                  <button
                    class="bg-[#1479FF] hover:bg-[#0f66e0] text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                    @click="openTransfer(row)"
                  >
                    Transferir
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-if="!stocksStore.loading && stocksStore.stocks.length === 0" class="text-center py-10 text-gray-400 text-sm">
          No hay stock que coincida con los filtros
        </div>
      </div>

      <div v-if="stocksStore.totalPages > 1" class="flex items-center justify-end gap-3 text-sm text-[#193B68]">
        <button
          class="border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-40"
          :disabled="stocksStore.page <= 1"
          @click="load(() => stocksStore.goToPage(stocksStore.page - 1))"
        >
          Anterior
        </button>
        <span>Página {{ stocksStore.page }} de {{ stocksStore.totalPages }}</span>
        <button
          class="border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-40"
          :disabled="stocksStore.page >= stocksStore.totalPages"
          @click="load(() => stocksStore.goToPage(stocksStore.page + 1))"
        >
          Siguiente
        </button>
      </div>
    </div>

    <AppModal
      :open="showAdjust"
      title="Ajustar stock"
      confirm-label="Guardar"
      :loading="saving"
      @close="showAdjust = false"
      @confirm="submitAdjust"
    >
      <p class="text-sm text-gray-500">{{ adjustTarget?.productName }} en {{ adjustTarget?.locationName }}</p>
      <p v-if="modalError" class="text-sm text-[#DC2626] bg-[#FEE2E2] rounded-xl px-4 py-2">{{ modalError }}</p>
      <label class="block text-sm font-medium text-[#193B68]">
        Cantidad final
        <input
          v-model.number="adjustQty"
          type="number"
          min="0"
          step="1"
          class="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent"
        />
      </label>
    </AppModal>

    <AppModal
      :open="showTransfer"
      title="Transferir stock"
      confirm-label="Transferir"
      :loading="saving"
      @close="showTransfer = false"
      @confirm="submitTransfer"
    >
      <p class="text-sm text-gray-500">{{ transferTarget?.productName }} desde {{ transferTarget?.locationName }}</p>
      <p v-if="modalError" class="text-sm text-[#DC2626] bg-[#FEE2E2] rounded-xl px-4 py-2">{{ modalError }}</p>
      <label class="block text-sm font-medium text-[#193B68]">
        Destino
        <select
          v-model="transferTo"
          class="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] bg-white focus:outline-none focus:ring-2 focus:ring-[#1479FF]"
        >
          <option value="">Elegir destino…</option>
          <option
            v-for="location in destinationOptions"
            :key="location.id"
            :value="location.id"
          >
            {{ location.name }} — {{ typeLabel(location.type) }}
          </option>
        </select>
      </label>
      <label class="block text-sm font-medium text-[#193B68]">
        Cantidad
        <input
          v-model.number="transferQty"
          type="number"
          min="1"
          step="1"
          class="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent"
        />
      </label>
    </AppModal>
  </DashboardLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import PageHeader from '../components/ui/PageHeader.vue'
import SkeletonBlock from '../components/ui/SkeletonBlock.vue'
import AppModal from '../components/ui/AppModal.vue'
import { useStocksStore } from '../stores/stocksStore'
import { useProductsStore } from '../stores/productsStore'
import { useCatalogStore } from '../stores/catalogStore'
import { useToastStore } from '../stores/toastStore'
import { errorMessage } from '../utils/format'

const stocksStore = useStocksStore()
const productsStore = useProductsStore()
const catalogStore = useCatalogStore()
const toast = useToastStore()

const showAdjust = ref(false)
const showTransfer = ref(false)
const saving = ref(false)
const modalError = ref('')
const adjustTarget = ref(null)
const adjustQty = ref(0)
const transferTarget = ref(null)
const transferTo = ref('')
const transferQty = ref(1)

const typeLabel = (type) =>
  type === 'warehouse' ? 'Depósito' : type === 'store' ? 'Local' : 'Otro'

const load = async (action) => {
  try {
    await action()
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudo cargar el stock'), 'error')
  }
}

const applyFilter = (changes) => load(() => stocksStore.applyFilters(changes))

const productById = computed(() => new Map(productsStore.products.map((p) => [p.id, p])))
const locationById = computed(() => new Map(catalogStore.locations.map((l) => [l.id, l])))

// Las filas de /stocks son planas (sin join): se enriquecen con las listas ya cargadas.
const enrichedStocks = computed(() =>
  stocksStore.stocks.map((row) => {
    const product = productById.value.get(row.product_id)
    const location = locationById.value.get(row.location_id)
    const minStock = product?.min_stock
    return {
      ...row,
      productName: product?.name ?? `Producto #${row.product_id}`,
      productSku: product?.sku ?? '',
      locationName: location?.name ?? `Ubicación #${row.location_id}`,
      locationType: location?.type ?? 'other',
      isLow: minStock != null && row.quantity < minStock
    }
  })
)

const destinationOptions = computed(() =>
  catalogStore.locations.filter((l) => l.id !== transferTarget.value?.location_id)
)

const openAdjust = (row) => {
  adjustTarget.value = row
  adjustQty.value = row.quantity
  modalError.value = ''
  showAdjust.value = true
}

const openTransfer = (row) => {
  transferTarget.value = row
  transferTo.value = ''
  transferQty.value = 1
  modalError.value = ''
  showTransfer.value = true
}

const submitAdjust = async () => {
  modalError.value = ''
  saving.value = true
  try {
    await stocksStore.adjust({
      product_id: adjustTarget.value.product_id,
      location_id: adjustTarget.value.location_id,
      quantity: adjustQty.value
    })
    showAdjust.value = false
    toast.add('Stock ajustado')
  } catch (err) {
    modalError.value = errorMessage(err, 'No se pudo ajustar el stock')
  } finally {
    saving.value = false
  }
}

const submitTransfer = async () => {
  modalError.value = ''
  saving.value = true
  try {
    await stocksStore.transfer({
      product_id: transferTarget.value.product_id,
      from_location_id: transferTarget.value.location_id,
      to_location_id: Number(transferTo.value),
      quantity: transferQty.value
    })
    showTransfer.value = false
    toast.add('Stock transferido')
  } catch (err) {
    modalError.value = errorMessage(err, 'No se pudo transferir el stock')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  load(() => Promise.all([
    stocksStore.fetchStocks(),
    productsStore.fetchProducts(),
    catalogStore.fetchAll()
  ]))
})
</script>
