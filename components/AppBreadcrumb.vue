<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="flex items-center space-x-2">
      <li v-for="(item, index) in breadcrumbs" :key="item.path" class="flex items-center">
        <NuxtLink 
          :to="item.path"
          class="text-sm font-mono tracking-wide transition-all duration-200"
          :class="index === breadcrumbs.length - 1 
            ? 'text-cyan-400 font-bold' 
            : 'text-cyan-400/60 hover:text-cyan-400'"
        >
          {{ item.name }}
        </NuxtLink>
        <span 
          v-if="index < breadcrumbs.length - 1"
          class="mx-2 text-cyan-400/40"
        >
          /
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
const route = useRoute()

const breadcrumbs = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean)
  const crumbs = [{ name: 'ROOT', path: '/' }]
  
  let currentPath = ''
  pathSegments.forEach(segment => {
    currentPath += `/${segment}`
    crumbs.push({
      name: segment.toUpperCase().replace(/-/g, '_'),
      path: currentPath
    })
  })
  
  return crumbs
})
</script>