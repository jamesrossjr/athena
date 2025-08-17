<template>
  <div class="metric-card bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div 
        class="p-3 rounded-lg"
        :class="getIconBackground(color)"
      >
        <UIcon 
          :name="icon" 
          class="w-6 h-6"
          :class="getIconColor(color)"
        />
      </div>
      
      <!-- Trend Indicator -->
      <div 
        v-if="change !== undefined"
        class="flex items-center gap-1 text-sm font-medium"
        :class="getTrendColor(change)"
      >
        <UIcon 
          :name="change >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
          class="w-4 h-4"
        />
        <span>{{ Math.abs(change) }}{{ changeUnit }}</span>
      </div>
    </div>

    <!-- Content -->
    <div class="space-y-2">
      <!-- Value -->
      <div class="text-3xl font-bold text-gray-900">
        {{ value }}
      </div>
      
      <!-- Title -->
      <div class="text-sm text-gray-600">
        {{ title }}
      </div>
      
      <!-- Description -->
      <div v-if="description" class="text-xs text-gray-500">
        {{ description }}
      </div>
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-gray-100">
      <slot name="footer" />
    </div>

    <!-- Sparkline -->
    <div v-if="sparklineData" class="mt-4">
      <div class="h-12">
        <Sparkline 
          :data="sparklineData" 
          :color="color"
          class="w-full h-full"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  icon: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'gray'
  change?: number
  changeUnit?: string
  description?: string
  sparklineData?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  changeUnit: '%'
})

// Methods
const getIconBackground = (color: string) => {
  const backgrounds = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100',
    pink: 'bg-pink-100',
    gray: 'bg-gray-100'
  }
  return backgrounds[color] || backgrounds.blue
}

const getIconColor = (color: string) => {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    pink: 'text-pink-600',
    gray: 'text-gray-600'
  }
  return colors[color] || colors.blue
}

const getTrendColor = (change: number) => {
  if (change > 0) return 'text-green-600'
  if (change < 0) return 'text-red-600'
  return 'text-gray-600'
}
</script>

<style scoped>
.metric-card {
  transition: all 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-1px);
}
</style>