<template>
  <div>
    <h1>Simple Test Page</h1>
    <p>Testing basic Nuxt functionality</p>
    <button @click="count++">Count: {{ count }}</button>
  </div>
</template>

<script setup>
const count = ref(0)
</script>