<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="flex items-center space-x-2">
      <li v-for="(item, index) in breadcrumbs" :key="item.path" class="flex items-center">
        <NuxtLink 
          :to="item.path"
          class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          :class="{ 'text-gray-900 dark:text-white': index === breadcrumbs.length - 1 }"
        >
          {{ item.name }}
        </NuxtLink>
        <Icon 
          v-if="index < breadcrumbs.length - 1"
          name="heroicons:chevron-right"
          class="h-4 w-4 text-gray-400 mx-2"
        />
      </li>
    </ol>
  </nav>
</template>

<script setup>
const route = useRoute()

const breadcrumbs = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean)
  const crumbs = [{ name: 'Home', path: '/' }]
  
  let currentPath = ''
  pathSegments.forEach(segment => {
    currentPath += `/${segment}`
    crumbs.push({
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      path: currentPath
    })
  })
  
  return crumbs
})
</script>