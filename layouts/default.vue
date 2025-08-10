<template>
  <div class="h-screen w-screen overflow-hidden m-0 p-0">
    <slot />
    
    <!-- Global Command Palette -->
    <CommandPalette :is-open="isCommandPaletteOpen" @close="closeCommandPalette" />
  </div>
</template>

<script setup>
const { isOpen: isCommandPaletteOpen, close: closeCommandPalette } = useCommandPalette()
</script>