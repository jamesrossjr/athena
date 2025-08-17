<script setup lang="ts">
interface Props {
  workspaceId: string
}

const props = defineProps<Props>()

const isVisible = ref(false)
const GraphVisualizer = defineAsyncComponent(() => import('./GraphVisualizer.vue'))

// Intersection Observer for lazy loading
const containerRef = ref<HTMLElement>()

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        isVisible.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.1 }
  )

  if (containerRef.value) {
    observer.observe(containerRef.value)
  }

  onUnmounted(() => {
    observer.disconnect()
  })
})
</script>

<template>
  <div ref="containerRef" class="min-h-96">
    <div v-if="!isVisible" class="flex items-center justify-center h-96">
      <div class="text-center">
        <div class="loading-skeleton w-16 h-16 rounded-full mx-auto mb-4"></div>
        <p class="text-gray-600">Loading graph visualizer...</p>
      </div>
    </div>
    
    <Suspense v-else>
      <template #default>
        <GraphVisualizer :workspace-id="workspaceId" />
      </template>
      <template #fallback>
        <div class="flex items-center justify-center h-96">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600">Initializing graph...</p>
          </div>
        </div>
      </template>
    </Suspense>
  </div>
</template>