<template>
  <div class="welcome-mat">
    <div class="welcome-content">
      <h1 class="welcome-title">Welcome to Athena</h1>
      <p class="welcome-prompt">Press <kbd>{{ isMac ? 'Cmd' : 'Ctrl' }}</kbd> + <kbd>K</kbd> to begin</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const isMac = computed(() => {
  if (process.client) {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0
  }
  return false
})
</script>

<style scoped>
.welcome-mat {
  min-height: 100vh;
  background-color: #F8F8F4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, -apple-system, sans-serif;
}

.welcome-content {
  text-align: center;
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 400;
  color: #333333;
  margin: 0 0 2rem 0;
  letter-spacing: -0.01em;
}

.welcome-prompt {
  font-size: 1.125rem;
  color: #666666;
  margin: 0;
  font-weight: 400;
}

kbd {
  font-family: ui-monospace, monospace;
  font-size: 1rem;
  font-weight: 500;
  color: #333333;
  background-color: #FEFEFE;
  border: 1px solid #E0E0D8;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  box-shadow: 0 1px 2px rgba(51, 51, 51, 0.05);
  display: inline-block;
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 2rem;
  }
  
  .welcome-prompt {
    font-size: 1rem;
  }
}
</style>