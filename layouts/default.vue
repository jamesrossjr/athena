<template>
  <div class="h-screen w-screen overflow-hidden m-0 p-0">
    <slot />
    
    <!-- Command Palette -->
    <CommandPalette :is-open="isCommandPaletteOpen" @close="closeCommandPalette" />
  </div>
</template>

<script setup lang="ts">
const isCommandPaletteOpen = ref(false)
const sessionStore = useSessionStore()
const { listenForAuthStateChange } = useAuth()

const openCommandPalette = () => {
  isCommandPaletteOpen.value = true
}

const closeCommandPalette = () => {
  isCommandPaletteOpen.value = false
}

// Handle Ctrl+K to open command palette
const handleKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    openCommandPalette()
  }
  
  if (event.key === 'Escape' && isCommandPaletteOpen.value) {
    closeCommandPalette()
  }
}

// Auth state cleanup function
let authCleanup: (() => void) | null = null

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  
  // Initialize session store
  await sessionStore.loadSession()
  
  // Set up auth state listener
  const { data } = listenForAuthStateChange()
  authCleanup = data?.subscription?.unsubscribe || null
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  
  // Clean up auth listener
  if (authCleanup) {
    authCleanup()
  }
})
</script>