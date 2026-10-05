<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-[#193B68]"
  >
    <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: label.color ?? '#94a3b8' }"></span>
    {{ label.name }}
  </span>
</template>

<script setup>
defineProps({
  label: { type: Object, required: true }
})
</script>
