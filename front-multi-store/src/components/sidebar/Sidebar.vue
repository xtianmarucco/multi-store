<template>
  <aside
    class="flex h-full flex-col bg-[#0F2340] text-slate-300 shadow-[0_24px_50px_rgba(15,35,64,0.35)] transition-transform duration-300 ease-out lg:translate-x-0 lg:shadow-none"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex items-center gap-3 border-b border-white/10 px-5 py-5">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1479FF] shrink-0">
        <i class="icon-package-2 text-white text-base"></i>
      </div>
      <div class="min-w-0">
        <p class="text-white font-bold text-sm leading-tight">Multi Store</p>
        <p class="text-slate-400 text-xs leading-tight">Inventario</p>
      </div>
      <button
        type="button"
        class="ml-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
        @click="emit('close')"
        aria-label="Cerrar menú"
      >
        ✕
      </button>
    </div>

    <div class="flex flex-1 flex-col overflow-hidden px-3 py-4">
      <nav class="flex flex-col gap-1 overflow-y-auto">
        <SidebarItem icon="layout-dashboard" label="Dashboard" to="/dashboard" @navigate="emit('close')" />
        <SidebarItem icon="package" label="Productos" to="/products" :active="route.path.startsWith('/products')" @navigate="emit('close')" />
        <SidebarItem icon="warehouse" label="Stock" to="/stocks" @navigate="emit('close')" />
        <SidebarItem icon="tags" label="Categorías" to="/categories" @navigate="emit('close')" />
        <SidebarItem icon="boxes" label="Items" to="/items" :active="route.path.startsWith('/items')" @navigate="emit('close')" />
        <SidebarItem icon="map-pin" label="Ubicaciones" to="/locations" @navigate="emit('close')" />
        <SidebarItem icon="tag" label="Etiquetas" to="/labels" @navigate="emit('close')" />
        <SidebarItem v-if="authStore.isAdmin" icon="users" label="Usuarios" to="/users" @navigate="emit('close')" />
      </nav>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
import SidebarItem from '../sidebar-item/SidebarItem.vue'
import { useAuthStore } from '../../stores/authStore'

defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const route = useRoute()
const authStore = useAuthStore()
</script>
