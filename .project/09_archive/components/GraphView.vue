<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Knowledge Graph</h3>
        <UButton variant="ghost" size="xs" icon="i-heroicons-arrows-pointing-out" />
      </div>
    </template>
    
    <div class="graph-container h-64 flex items-center justify-center">
      <div class="text-center text-gray-500">
        <Icon name="heroicons:share" class="h-12 w-12 mx-auto mb-2" />
        <p class="text-sm">Graph visualization</p>
        <p class="text-xs">Coming soon</p>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-between text-sm text-gray-500">
        <span>{{ nodeCount }} nodes</span>
        <span>{{ linkCount }} connections</span>
      </div>
    </template>
  </UCard>
</template>

<script setup>
const props = defineProps(['selectedNote'])

const nodeCount = 42
const linkCount = 87
</script>