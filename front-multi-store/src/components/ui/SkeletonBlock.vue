<template>
  <div class="skeleton-block" :style="{ width, height, borderRadius: rounded, flexShrink: 0 }" />
</template>

<script setup>
defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '1rem' },
  rounded: { type: String, default: '0.5rem' }
})
</script>

<style scoped>
.skeleton-block {
  background: linear-gradient(90deg, #F0F4FA 25%, #E2EAF4 50%, #F0F4FA 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
