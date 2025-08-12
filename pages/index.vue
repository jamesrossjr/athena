<template>
  <div class="app">
    
    <!-- Show Welcome Screen Initially -->
    <WelcomeScreen v-if="!hasActiveWorkspace" />
    
    <!-- Shell Layout for Workspace -->
    <NuxtLayout v-else name="shell">
      <!-- Content will be rendered by the shell layout -->
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import WelcomeScreen from '~/components/WelcomeScreen.vue'

// Use global state from app.vue
const globalState = inject('globalCommandPalette')
const hasActiveWorkspace = globalState?.hasActiveWorkspace || computed(() => false)

// Test function to bypass CommandPalette issues
const testPageCreation = async () => {
  console.log('🧪 Testing direct page creation')
  
  // First create a workspace if needed
  if (!globalState?.currentWorkspace?.value) {
    console.log('🏗️ Creating test workspace first')
    const testWorkspace = {
      id: 'test-workspace-' + Date.now(),
      name: 'Test Workspace',
      icon: '🧪',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    globalState.currentWorkspace.value = testWorkspace
    console.log('✅ Workspace created:', testWorkspace)
  }
  
  // Create test page
  const pageId = 'test-page-' + Date.now()
  const testPage = {
    id: pageId,
    title: 'Test Page',
    type: 'DOCUMENT',
    workspaceId: globalState.currentWorkspace.value.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  console.log('📄 Creating test page:', testPage)
  console.log('🧭 Navigating to:', `/page/${testPage.id}`)
  
  // Navigate directly
  try {
    await navigateTo(`/page/${testPage.id}`)
    console.log('✅ Navigation completed to page ID:', testPage.id)
  } catch (error) {
    console.error('❌ Navigation failed:', error)
  }
}

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