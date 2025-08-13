<template>
  <NuxtLayout name="shell">
    <!-- The shell layout will handle rendering the page based on the ID -->
    <!-- Global CommandPalette is available from app.vue -->
  </NuxtLayout>
</template>

<script setup lang="ts">
// The route parameter will be automatically available
const route = useRoute()
const pageId = route.params.id

console.log('📄 Page route loaded for ID:', pageId)

// Access global state to ensure we have workspace context
const globalState = inject('globalCommandPalette')
console.log('🌐 Page has global state:', !!globalState)

// Set page title
useHead({
  title: `Page ${pageId} - Athena`
})
</script>