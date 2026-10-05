<template>
  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
    <div class="flex flex-col gap-1">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ title }}</p>
      <p class="text-3xl font-bold text-[#193B68]">{{ value }}</p>
      <p class="text-sm text-gray-400">{{ description }}</p>
    </div>
    <div :class="`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`">
      <i :class="`icon-${icon} text-xl ${iconColor}`"></i>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  description: String,
  icon: { type: String, default: 'package' },
  iconBg: { type: String, default: 'bg-blue-50' },
  iconColor: { type: String, default: 'text-[#1479FF]' }
})
</script>

<style scoped>
</style>
