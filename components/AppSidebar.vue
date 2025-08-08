<template>
  <div class="flex flex-col h-screen sidebar">
    <!-- Cyberpunk Athena Logo -->
    <div class="flex items-center px-6 py-6 border-b border-cyan-500/30 relative overflow-hidden">
      <!-- Background glow effect -->
      <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,212,255,0.1),transparent_50%)]"></div>
      
      <div class="relative z-10 flex items-center">
        <!-- Athena goddess icon with neural circuits -->
        <div class="relative">
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 shadow-2xl shadow-cyan-500/50 border-2 border-cyan-400/30 athena-neural-glow">
            <Icon name="heroicons:sparkles" class="h-6 w-6 text-white neural-pulse" />
            <!-- Neural circuit overlay -->
            <div class="absolute inset-0 rounded-full border border-cyan-400/40 animate-pulse"></div>
            <div class="absolute -inset-1 rounded-full border border-cyan-400/20 animate-pulse" style="animation-delay: 0.5s"></div>
            <div class="absolute -inset-2 rounded-full border border-purple-400/10 animate-pulse" style="animation-delay: 1s"></div>
          </div>
          <!-- Floating data particles -->
          <div class="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping shadow-lg shadow-cyan-400/50"></div>
          <div class="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping shadow-lg shadow-purple-400/50" style="animation-delay: 1s"></div>
          <div class="absolute top-0 -left-2 w-1 h-1 bg-blue-400 rounded-full animate-ping" style="animation-delay: 2s"></div>
        </div>
        
        <!-- Brand Name -->
        <div class="ml-4">
          <div class="flex items-center space-x-2">
            <span class="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
              ATHENA
            </span>
            <!-- Cyberpunk-style accent -->
            <div class="flex flex-col space-y-0.5">
              <div class="w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent"></div>
              <div class="w-4 h-0.5 bg-gradient-to-r from-purple-400 to-transparent"></div>
            </div>
          </div>
          <div class="flex items-center mt-1 space-x-2">
            <span class="text-xs font-mono text-cyan-400/80 tracking-wider">NEURAL.OS</span>
            <div class="px-1.5 py-0.5 text-xs font-mono bg-cyan-400/20 text-cyan-300 rounded border border-cyan-400/30 shadow-sm shadow-cyan-400/25">
              AI
            </div>
            <div class="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <!-- Animated circuit lines -->
      <div class="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div class="absolute top-2 left-16 w-16 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
        <div class="absolute bottom-2 right-16 w-12 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" style="animation-delay: 1.5s"></div>
      </div>
    </div>
    
    <!-- Cyberpunk Status Indicator -->
    <div class="px-6 py-4 border-b border-cyan-500/20">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="relative">
            <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            <div class="absolute inset-0 w-3 h-3 bg-green-400/30 rounded-full animate-ping"></div>
          </div>
          <div>
            <span class="text-sm font-mono text-cyan-400 tracking-wide">SYSTEM_STATUS</span>
            <div class="text-xs text-green-400 font-medium">● ONLINE</div>
          </div>
        </div>
        <div class="text-xs font-mono text-cyan-400/60">
          <div>{{ currentTime }}</div>
        </div>
      </div>
    </div>
    
    <!-- Navigation -->
    <nav class="flex-1 px-4 py-2 space-y-1">
      <NuxtLink
        v-for="item in navigation"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="[
          $route.path === item.path || ($route.path.startsWith(item.path) && item.path !== '/') 
            ? 'active' 
            : ''
        ]"
      >
        <Icon :name="item.icon" class="h-5 w-5 mr-3" />
        <span>{{ item.name }}</span>
        <div v-if="item.badge" class="ml-auto">
          <span class="status-indicator status-online">{{ item.badge }}</span>
        </div>
      </NuxtLink>
    </nav>
    
    <!-- Cyberpunk Quick Actions -->
    <div class="px-4 py-4 border-t border-cyan-500/20">
      <div class="space-y-3">
        <div class="text-xs font-mono text-cyan-400/80 tracking-wider uppercase mb-3">QUICK_ACCESS</div>
        <button class="w-full flex items-center justify-start px-3 py-2 text-sm font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400/50 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25">
          <Icon name="heroicons:plus" class="h-4 w-4 mr-3" />
          NEW_NOTE
        </button>
        <button class="w-full flex items-center justify-start px-3 py-2 text-sm font-mono bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400/50 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25">
          <Icon name="heroicons:sparkles" class="h-4 w-4 mr-3" />
          AI_ASSIST
        </button>
      </div>
    </div>
    
    <!-- Cyberpunk Footer -->
    <div class="p-4 border-t border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-purple-500/5">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="relative">
            <div class="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center border border-cyan-400/30 shadow-lg shadow-cyan-500/25">
              <Icon name="heroicons:user" class="h-4 w-4 text-white" />
            </div>
            <div class="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <div class="text-xs font-mono text-cyan-400 tracking-wide">ADMIN_USER</div>
            <div class="text-xs font-mono text-cyan-400/60">NEURAL.OS.v{{ $config.public.version }}</div>
          </div>
        </div>
        <button class="p-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400/50 rounded-lg transition-all duration-300">
          <Icon name="heroicons:ellipsis-horizontal" class="h-3 w-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Current time for cyberpunk status display
const currentTime = computed(() => {
  return new Date().toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
})

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