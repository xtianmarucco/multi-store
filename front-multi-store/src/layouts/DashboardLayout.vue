<template>
  <div class="flex h-screen bg-[#F5F7FB]">
    <Sidebar class="hidden h-screen w-[var(--width-sidebar)] shrink-0 lg:flex" :is-open="true" />

    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
      @click="closeSidebar"
    ></div>

    <Sidebar
      :is-open="isSidebarOpen"
      @close="closeSidebar"
      class="fixed inset-y-0 left-0 z-50 w-[var(--width-sidebar)] shrink-0 lg:hidden"
    />

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div class="border-b border-gray-200 bg-[#F5F7FB] px-4 py-3 sm:px-6">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white text-[var(--color-text-base)] shadow-[var(--shadow-input)] transition hover:border-[#CFE0FF] hover:bg-[#F8FBFF] lg:hidden"
              @click="toggleSidebar"
              aria-label="Abrir menú"
            >
              ☰
            </button>

            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] lg:hidden">Multi Store</p>
              <p class="text-sm font-medium text-[#193B68] sm:text-base">{{ pageTitle }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2.5">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1479FF] text-sm font-semibold text-white">
                {{ userInitial }}
              </div>
              <div class="hidden leading-tight sm:block">
                <p class="text-sm font-medium text-[#193B68]">{{ authStore.user?.full_name }}</p>
                <p class="text-xs text-[var(--color-text-muted)]">{{ authStore.user?.role === 'admin' ? 'Administrador' : 'Colaborador' }}</p>
              </div>
            </div>
            <button
              @click="handleLogout"
              class="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-text-muted)] shadow-[var(--shadow-input)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>

      <main class="flex-1 overflow-y-auto p-4 sm:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '../components/sidebar/Sidebar.vue'
import { useAuthStore } from '../stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isSidebarOpen = ref(false)

const userInitial = computed(() => authStore.user?.full_name?.[0]?.toUpperCase() ?? '?')

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const pageTitles = {
  Dashboard: 'Dashboard',
  ItemsView: 'Items',
  ItemNew: 'Nuevo item',
  ItemEdit: 'Editar item',
  LocationsView: 'Ubicaciones',
  LabelsView: 'Etiquetas',
  UsersView: 'Usuarios'
}

const pageTitle = computed(() => pageTitles[route.name] ?? '')

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeSidebar()
  }
}

watch(() => route.fullPath, closeSidebar)

watch(isSidebarOpen, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleEscape)
})
</script>
