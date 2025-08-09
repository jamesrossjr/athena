<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <slot />
    
    <!-- Global Command Palette -->
    <CommandPalette :is-open="isCommandPaletteOpen" @close="closeCommandPalette" />
  </div>
</template>

<script setup>
const { isOpen: isCommandPaletteOpen, close: closeCommandPalette } = useCommandPalette()
</script>