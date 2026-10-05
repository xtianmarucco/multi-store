<template>
  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex flex-wrap gap-3 justify-between items-center">
    <div>
      <h1 class="text-xl font-bold text-[#193B68]">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-gray-400 mt-0.5">{{ subtitle }}</p>
    </div>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
})
</script>
