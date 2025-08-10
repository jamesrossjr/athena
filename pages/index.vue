<template>
  <div class="app">
    <!-- Clean Paper Interface with Advanced PKM Capabilities -->
    <PaperInterface />
    
    <!-- Development mode toggle (for switching between interfaces) -->
    <button
      v-if="showDevToggle"
      @click="toggleInterface"
      class="fixed bottom-4 right-4 px-3 py-2 bg-gray-500 text-white text-xs rounded shadow-lg hover:bg-gray-600 transition-colors z-50 opacity-50 hover:opacity-100"
    >
      {{ useAdvancedInterface ? 'Paper' : 'Advanced' }}
    </button>
    
    <!-- Advanced Interface (for development comparison) -->
    <div v-if="useAdvancedInterface" class="advanced-interface">
      <WorkspaceContainer />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PaperInterface from '~/components/PaperInterface.vue'
import WorkspaceContainer from '~/components/WorkspaceContainer.vue'

// Development state for interface comparison
const useAdvancedInterface = ref(false)
const showDevToggle = ref(process.env.NODE_ENV === 'development')

function toggleInterface() {
  useAdvancedInterface.value = !useAdvancedInterface.value
}

// Initialize the app
onMounted(() => {
  // Default to clean paper interface
  useAdvancedInterface.value = false
})

// SEO and Meta
useHead({
  title: 'Athena - Personal Knowledge Management',
  meta: [
    {
      name: 'description',
      content: 'Advanced PKM application with workspaces, document management, and intelligent organization.'
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1'
    }
  ]
})
</script>

<style scoped>
.app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  margin: 0;
  padding: 0;
  position: relative;
}

.advanced-interface {
  position: absolute;
  inset: 0;
  background-color: white;
  z-index: 40;
}

.dark .advanced-interface {
  background-color: rgb(17 24 39);
}
</style>