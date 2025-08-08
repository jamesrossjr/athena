<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar -->
    <USlideover v-model="sidebarOpen" side="left" class="lg:hidden">
      <div class="p-4">
        <AppSidebar />
      </div>
    </USlideover>
    
    <div class="lg:flex">
      <!-- Desktop Sidebar -->
      <div class="hidden lg:flex lg:w-64 lg:flex-col">
        <AppSidebar />
      </div>
      
      <!-- Main Content -->
      <div class="flex-1 lg:ml-0">
        <!-- Top Navigation -->
        <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between px-4 py-3">
            <div class="flex items-center space-x-4">
              <UButton
                variant="ghost"
                icon="i-heroicons-bars-3"
                class="lg:hidden"
                @click="sidebarOpen = true"
              />
              <AppBreadcrumb />
            </div>
            
            <div class="flex items-center space-x-4">
              <AppSearch />
              <AppUserMenu />
            </div>
          </div>
        </header>
        
        <!-- Page Content -->
        <main class="p-6">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
const sidebarOpen = ref(false)
</script>