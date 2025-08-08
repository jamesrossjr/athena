<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="isOpen = !isOpen"
      class="relative p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
    >
      <div class="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center border border-cyan-400/30">
        <Icon name="heroicons:user" class="h-4 w-4 text-white" />
      </div>
      <div class="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    </button>
    
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-64 origin-top-right rounded-xl cyber-panel shadow-2xl shadow-cyan-500/20 z-50"
      >
        <!-- User Info -->
        <div class="p-4 border-b border-cyan-500/30">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Icon name="heroicons:user" class="h-5 w-5 text-white" />
            </div>
            <div>
              <div class="text-sm font-mono text-cyan-400">ADMIN_USER</div>
              <div class="text-xs text-cyan-400/60">Neural Access Level: MAX</div>
            </div>
          </div>
        </div>
        
        <!-- Menu Items -->
        <div class="py-2">
          <button
            v-for="item in menuItems"
            :key="item.label"
            @click="item.click ? item.click() : null"
            class="flex items-center w-full px-4 py-3 text-sm font-mono text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all duration-200 group"
          >
            <div class="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mr-3 group-hover:bg-cyan-500/20 group-hover:border-cyan-400/50 transition-all">
              <Icon :name="item.icon" class="h-4 w-4 text-cyan-400" />
            </div>
            <span>{{ item.label }}</span>
            <Icon name="heroicons:chevron-right" class="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
        
        <!-- Footer -->
        <div class="p-3 border-t border-cyan-500/30">
          <button
            @click="handleSignOut"
            class="w-full flex items-center justify-center px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-400/50 rounded-lg transition-all duration-200 font-mono text-sm"
          >
            <Icon name="heroicons:arrow-right-on-rectangle" class="h-4 w-4 mr-2" />
            DISCONNECT
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const isOpen = ref(false)
const dropdownRef = ref(null)

const menuItems = [
  {
    label: 'USER_PROFILE',
    icon: 'heroicons:user',
    click: () => {
      navigateTo('/profile')
      isOpen.value = false
    }
  },
  {
    label: 'SYSTEM_CONFIG',
    icon: 'heroicons:cog-6-tooth',
    click: () => {
      navigateTo('/settings')
      isOpen.value = false
    }
  },
  {
    label: 'NEURAL_STATS',
    icon: 'heroicons:chart-bar',
    click: () => {
      navigateTo('/stats')
      isOpen.value = false
    }
  },
  {
    label: 'HELP_DOCS',
    icon: 'heroicons:question-mark-circle',
    click: () => {
      isOpen.value = false
    }
  }
]

const handleSignOut = () => {
  isOpen.value = false
  // Add sign out logic here
}

// Close dropdown when clicking outside
onMounted(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
      isOpen.value = false
    }
  }
  
  document.addEventListener('mousedown', handleClickOutside)
  
  onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside)
  })
})
</script>

<style scoped>
.cyber-panel {
  background: rgba(15, 15, 35, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 212, 255, 0.3);
}
</style>