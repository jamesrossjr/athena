<template>
  <div class="py-4">
    <div class="w-full h-px bg-[#e9e9e7] dark:bg-[#2f2f2f]"></div>
  </div>
</template>

<script setup>
const props = defineProps({
  block: {
    type: Object,
    required: true
  }
})
</script>