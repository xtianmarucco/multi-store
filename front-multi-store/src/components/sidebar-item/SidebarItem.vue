<template>
  <div>
    <RouterLink
      v-if="to"
      :to="to"
      custom
      v-slot="{ navigate, href, isActive: linkIsActive }"
    >
      <a :href="href" @click="handleNavigate($event, navigate)" :class="linkClasses(active ?? linkIsActive)">
        <i :class="`icon-${icon} text-base`"></i>
        <span class="text-sm font-medium">{{ label }}</span>
      </a>
    </RouterLink>

    <button
      v-else
      type="button"
      :class="linkClasses(active ?? false)"
      @click="$emit('toggle')"
    >
      <i :class="`icon-${icon} text-base`"></i>
      <span class="text-sm font-medium flex-1 text-left">{{ label }}</span>
      <i
        v-if="hasDropdown"
        :class="['icon-chevron-down text-xs transition-transform duration-200', { 'rotate-180': open }]"
      ></i>
    </button>

    <div v-if="hasDropdown && open" class="flex flex-col gap-0.5 mt-1 pl-8">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  active: { type: Boolean, default: undefined },
  to: { type: [String, Object], default: null },
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle', 'navigate'])

const linkClasses = (isActive) => [
  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-left',
  isActive
    ? 'bg-[#1479FF] text-white shadow-sm'
    : 'text-slate-400 hover:bg-white/7 hover:text-white'
]

const slots = useSlots()
const hasDropdown = computed(() => !!slots.default)

const handleNavigate = (event, navigate) => {
  navigate(event)
  emit('navigate')
}
</script>

<style scoped>
</style>
