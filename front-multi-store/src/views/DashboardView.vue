<template>
  <DashboardLayout>
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <SkeletonBlock width="90px" height="12px" />
          <SkeletonBlock width="70px" height="30px" />
        </div>
      </template>
      <template v-else-if="summary">
        <RouterLink to="/items">
          <DashboardCard title="Items" :value="summary.total_items" description="Activos (no archivados)" icon="boxes" />
        </RouterLink>
        <RouterLink to="/locations">
          <DashboardCard title="Ubicaciones" :value="summary.total_locations" description="Lugares registrados" icon="map-pin" />
        </RouterLink>
        <RouterLink to="/labels">
          <DashboardCard title="Etiquetas" :value="summary.total_labels" description="Para clasificar items" icon="tag" />
        </RouterLink>
        <DashboardCard
          title="Valor total"
          :value="formatMoney(summary.total_value)"
          description="Precio de compra × cantidad"
          icon="wallet"
          icon-bg="bg-green-50"
          icon-color="text-green-600"
        />
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import DashboardCard from '../components/dashboard-card/DashboardCard.vue'
import SkeletonBlock from '../components/ui/SkeletonBlock.vue'
import { getSummary } from '../services/DashboardService'
import { useToastStore } from '../stores/toastStore'
import { errorMessage, formatMoney } from '../utils/format'

const toast = useToastStore()
const summary = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    summary.value = await getSummary()
  } catch (err) {
    toast.add(errorMessage(err, 'No se pudo cargar el resumen'), 'error')
  } finally {
    loading.value = false
  }
})
</script>
