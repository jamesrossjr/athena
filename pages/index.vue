<template>
  <div class="app">
    <!-- Clean Paper Interface with Advanced PKM Capabilities -->
    <PaperInterface />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PaperInterface from '~/components/PaperInterface.vue'

// Initialize the app
onMounted(() => {
  // App initialization logic can go here
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