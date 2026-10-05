<template>
  <DashboardLayout>
    <div class="space-y-5">
      <PageHeader title="Items" :subtitle="`${itemsStore.total} resultado(s)`">
        <RouterLink
          to="/items/new"
          class="bg-[#1479FF] hover:bg-[#0f66e0] text-white font-medium px-5 py-2 rounded-full text-sm transition-colors"
        >
          + Nuevo item
        </RouterLink>
      </PageHeader>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          v-model="search"
          type="search"
          placeholder="Buscar por nombre, marca, modelo o serie…"
          class="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] focus:outline-none focus:ring-2 focus:ring-[#1479FF] focus:border-transparent sm:col-span-2 lg:col-span-1"
        />
        <select
          :value="itemsStore.filters.location_id"
          class="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] bg-white focus:outline-none focus:ring-2 focus:ring-[#1479FF]"
          @change="itemsStore.applyFilters({ location_id: $event.target.value })"
        >
          <option value="">Todas las ubicaciones</option>
          <option v-for="location in catalogStore.locationTree" :key="location.id" :value="location.id">
            {{ '— '.repeat(location.depth) }}{{ location.name }}
          </option>
        </select>
        <select
          :value="itemsStore.filters.label_id"
          class="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#193B68] bg-white focus:outline-none focus:ring-2 focus:ring-[#1479FF]"
          @change="itemsStore.applyFilters({ label_id: $event.target.value })"
        >
          <option value="">Todas las etiquetas</option>
          <option v-for="label in catalogStore.labels" :key="label.id" :value="label.id">{{ label.name }}</option>
        </select>
        <label class="flex items-center gap-2 text-sm text-[#193B68]">
          <input
            type="checkbox"
            :checked="itemsStore.filters.archived"
            class="h-4 w-4 accent-[#1479FF]"
            @change="itemsStore.applyFilters({ archived: $event.target.checked })"
          />
          Ver archivados
        </label>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table class="min-w-full text-sm text-left">
          <thead class="border-b border-gray-100">
            <tr>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nombre</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Ubicación</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Etiquetas</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Cant.</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Precio</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="itemsStore.loading">
              <tr v-for="i in 5" :key="`sk-${i}`" class="border-b border-gray-50">
                <td class="px-6 py-4"><SkeletonBlock width="180px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="100px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="80px" height="20px" rounded="999px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="30px" height="15px" /></td>
                <td class="px-6 py-4"><SkeletonBlock width="70px" height="15px" /></td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="item in itemsStore.items"
                :key="item.id"
                class="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                @click="router.push(`/items/${item.id}`)"
              >
                <td class="px-6 py-4">
                  <p class="font-medium text-[#193B68]">{{ item.name }}</p>
                  <p v-if="item.manufacturer || item.model_number" class="text-xs text-gray-400">
                    {{ [item.manufacturer, item.model_number].filter(Boolean).join(' · ') }}
                  </p>
                </td>
                <td class="px-6 py-4 text-gray-500">{{ item.location?.name ?? '—' }}</td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    <LabelBadge v-for="label in item.labels" :key="label.id" :label="label" />
                  </div>
                </td>
                <td class="px-6 py-4 text-right text-[#193B68]">{{ item.quantity }}</td>
                <td class="px-6 py-4 text-right text-[#193B68]">{{ formatMoney(item.purchase_price) }}</td>
              </tr>
            </template>
          </tbody>
        </table>
        <div v-if="!itemsStore.loading && itemsStore.items.length === 0" class="text-center py-10 text-gray-400 text-sm">
          No hay items que coincidan con los filtros
        </div>
      </div>

      <div v-if="itemsStore.totalPages > 1" class="flex items-center justify-end gap-3 text-sm text-[#193B68]">
        <button
          class="border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-40"
          :disabled="itemsStore.page <= 1"
          @click="itemsStore.goToPage(itemsStore.page - 1)"
        >
          Anterior
        </button>
        <span>Página {{ itemsStore.page }} de {{ itemsStore.totalPages }}</span>
        <button
          class="border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-40"
          :disabled="itemsStore.page >= itemsStore.totalPages"
          @click="itemsStore.goToPage(itemsStore.page + 1)"
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
import LabelBadge from '../components/ui/LabelBadge.vue'
import { useItemsStore } from '../stores/itemsStore'
import { useCatalogStore } from '../stores/catalogStore'
import { useToastStore } from '../stores/toastStore'
import { errorMessage, formatMoney } from '../utils/format'

const router = useRouter()
const itemsStore = useItemsStore()
const catalogStore = useCatalogStore()
const toast = useToastStore()

const search = ref(itemsStore.filters.search)

const load = async (action) => {
  try {
    await action()
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudieron cargar los items'), 'error')
  }
}

// Búsqueda con debounce para no disparar una request por tecla.
let searchTimer
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(() => itemsStore.applyFilters({ search: value })), 300)
})
// Si se sale de la vista con una búsqueda pendiente, se conserva el último valor tipeado.
onBeforeUnmount(() => {
  clearTimeout(searchTimer)
  itemsStore.filters.search = search.value
})

onMounted(() => {
  load(() => Promise.all([itemsStore.fetchItems(), catalogStore.fetchAll()]))
})
</script>
