<template>
  <div class="relative">
    <!-- Search Trigger Button -->
    <button
      @click="searchOpen = true"
      class="flex items-center px-3 py-2 text-sm font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400/50 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
    >
      <Icon name="heroicons:magnifying-glass" class="h-4 w-4 mr-2" />
      <span>SEARCH</span>
      <span class="ml-3 text-xs opacity-60 border-l border-cyan-500/30 pl-3">⌘K</span>
    </button>
    
    <!-- Search Modal Overlay -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="searchOpen"
          class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          @click.self="searchOpen = false"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
          
          <!-- Search Panel -->
          <div class="relative w-full max-w-2xl cyber-search-panel">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-cyan-500/30">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Icon name="heroicons:magnifying-glass" class="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 class="text-lg font-bold text-cyan-400">NEURAL SEARCH</h3>
                  <p class="text-xs text-cyan-400/60 font-mono">QUERY.KNOWLEDGE.BASE</p>
                </div>
              </div>
              <button
                @click="searchOpen = false"
                class="p-2 text-cyan-400/60 hover:text-cyan-400 transition-colors"
              >
                <Icon name="heroicons:x-mark" class="h-5 w-5" />
              </button>
            </div>
            
            <!-- Search Content -->
            <div class="p-6">
              <!-- Search Input -->
              <div class="relative mb-6">
                <Icon name="heroicons:magnifying-glass" class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400/60" />
                <input
                  ref="searchInput"
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search notes, tasks, projects..."
                  class="w-full pl-12 pr-4 py-3 bg-black/50 border border-cyan-500/30 text-white rounded-xl focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/25 transition-all font-mono"
                  @keydown.escape="searchOpen = false"
                />
                <div class="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-cyan-400/40 font-mono">
                  ESC to close
                </div>
              </div>
              
              <!-- Search Results -->
              <div v-if="searchResults.length > 0" class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                <div
                  v-for="result in searchResults"
                  :key="result.id"
                  class="group p-4 bg-black/30 border border-cyan-500/20 hover:border-cyan-400/40 rounded-lg cursor-pointer transition-all hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20"
                  @click="selectResult(result)"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {{ result.title }}
                      </div>
                      <div class="text-sm text-gray-400 mt-1">
                        {{ result.excerpt }}
                      </div>
                    </div>
                    <div class="ml-4 px-2 py-1 text-xs font-mono bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30">
                      {{ result.type }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- No Results -->
              <div v-else-if="searchQuery" class="text-center py-12">
                <Icon name="heroicons:magnifying-glass" class="h-12 w-12 text-cyan-400/20 mx-auto mb-4" />
                <p class="text-gray-400">No results found for</p>
                <p class="text-cyan-400 font-mono mt-2">"{{ searchQuery }}"</p>
              </div>
              
              <!-- Empty State -->
              <div v-else class="text-center py-12">
                <div class="neural-waves mb-4">
                  <div class="wave wave-1"></div>
                  <div class="wave wave-2"></div>
                  <div class="wave wave-3"></div>
                </div>
                <p class="text-gray-400 text-sm">Start typing to search your knowledge base</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
const searchOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)

// Mock search results for now
const searchResults = computed(() => {
  if (!searchQuery.value) return []
  
  return [
    {
      id: '1',
      title: 'Project Planning Notes',
      excerpt: 'Key insights on project management and planning strategies...',
      type: 'NOTE'
    },
    {
      id: '2', 
      title: 'AI Implementation Task',
      excerpt: 'Implement RAG pipeline for knowledge retrieval...',
      type: 'TASK'
    },
    {
      id: '3',
      title: 'Neural Network Architecture',
      excerpt: 'Deep dive into transformer models and attention mechanisms...',
      type: 'RESEARCH'
    }
  ]
})

const selectResult = (result) => {
  // Navigate to result
  searchOpen.value = false
  searchQuery.value = ''
}

// Focus input when opened
watch(searchOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})

// Global search shortcut
onMounted(() => {
  const handleKeyboard = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      searchOpen.value = true
    }
  }
  
  document.addEventListener('keydown', handleKeyboard)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyboard)
  })
})
</script>

<style scoped>
.cyber-search-panel {
  background: rgba(15, 15, 35, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 1.5rem;
  box-shadow: 
    0 0 40px rgba(0, 212, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: panel-appear 0.3s ease-out;
}

@keyframes panel-appear {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>