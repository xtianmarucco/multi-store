<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="pointer-events-auto flex w-80 max-w-[calc(100vw-3rem)] items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lg"
          :class="toast.type === 'error'
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-green-200 bg-green-50 text-green-800'"
        >
          <span
            class="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            :class="toast.type === 'error' ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'"
          >
            {{ toast.type === 'error' ? '✕' : '✓' }}
          </span>
          <p class="flex-1 text-sm font-medium leading-snug">{{ toast.message }}</p>
          <button
            class="shrink-0 text-sm opacity-50 transition hover:opacity-100"
            @click="toastStore.remove(toast.id)"
          >✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '../../stores/toastStore'
const toastStore = useToastStore()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(calc(100% + 1.5rem));
}
</style>
