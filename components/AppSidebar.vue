<template>
  <div class="flex flex-col h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
    <!-- Logo -->
    <div class="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <Icon name="heroicons:cpu-chip" class="h-8 w-8 text-blue-600" />
      <span class="ml-2 text-xl font-bold text-gray-900 dark:text-white">Athena</span>
    </div>
    
    <!-- Navigation -->
    <nav class="flex-1 px-4 py-4 space-y-2">
      <NuxtLink
        v-for="item in navigation"
        :key="item.path"
        :to="item.path"
        class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="[
          $route.path.startsWith(item.path) 
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        ]"
      >
        <Icon :name="item.icon" class="h-5 w-5 mr-3" />
        {{ item.name }}
      </NuxtLink>
    </nav>
    
    <!-- Footer -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>v{{ $config.public.version }}</span>
        <UButton variant="ghost" size="xs" icon="i-heroicons-cog-6-tooth" />
      </div>
    </div>
  </div>
</template>

<script setup>
const navigation = [
  {
    name: 'Dashboard',
    path: '/',
    icon: 'heroicons:home'
  },
  {
    name: 'Vault',
    path: '/vault',
    icon: 'heroicons:folder'
  },
  {
    name: 'Chat',
    path: '/chat',
    icon: 'heroicons:chat-bubble-left-right'
  },
  {
    name: 'Projects',
    path: '/projects',
    icon: 'heroicons:briefcase'
  },
  {
    name: 'Briefings',
    path: '/briefings',
    icon: 'heroicons:document-text'
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: 'heroicons:cog-6-tooth'
  }
]
</script>