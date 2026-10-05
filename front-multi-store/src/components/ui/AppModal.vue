<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" @click.self="emit('close')">
      <div class="bg-white rounded-2xl shadow-xl w-full p-6 space-y-5" :class="maxWidth">
        <h2 class="text-lg font-bold text-[#193B68]">{{ title }}</h2>
        <slot />
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            class="border border-gray-200 text-[#193B68] font-medium px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="loading"
            class="text-white font-medium px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
            :class="danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#1479FF] hover:bg-[#0f66e0]'"
            @click="emit('confirm')"
          >
            {{ loading ? 'Guardando...' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  confirmLabel: { type: String, default: 'Guardar' },
  loading: { type: Boolean, default: false },
  danger: { type: Boolean, default: false },
  maxWidth: { type: String, default: 'max-w-md' }
})

const emit = defineEmits(['close', 'confirm'])
</script>
