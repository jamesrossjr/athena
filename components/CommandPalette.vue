<template>
  <Teleport to="body">
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-start justify-center pt-20"
      @click="handleBackdropClick"
    >
      <!-- Glass backdrop with blur -->
      <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      <!-- Command Palette -->
      <div class="relative w-full max-w-2xl mx-4">
        <div class="glass-panel rounded-xl border border-white/20 shadow-2xl overflow-hidden">
          <!-- Search Input -->
          <div class="p-4 border-b border-white/10">
            <div class="relative">
              <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Search Word-like commands... (press / to open)"
                class="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                @keydown="handleKeyDown"
              />
            </div>
          </div>

          <!-- Commands List -->
          <div class="max-h-96 overflow-y-auto">
            <div v-if="filteredCommands.length === 0" class="p-8 text-center text-gray-400">
              <Icon name="heroicons:command-line" class="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No commands found</p>
            </div>
            
            <div v-else>
              <!-- Group by Category -->
              <div
                v-for="(group, category) in groupedCommands"
                :key="category"
                class="border-b border-white/5 last:border-b-0"
              >
                <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-white/5">
                  {{ category }}
                </div>
                
                <div
                  v-for="(command, index) in group"
                  :key="command.id"
                  :class="[
                    'flex items-center justify-between p-3 mx-2 my-1 rounded-lg cursor-pointer transition-all duration-150',
                    selectedIndex === getGlobalIndex(category, index)
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'hover:bg-white/5'
                  ]"
                  @click="executeCommand(command)"
                  @mouseenter="selectedIndex = getGlobalIndex(category, index)"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center">
                      <Icon
                        v-if="command.icon"
                        :name="`heroicons:${command.icon}`"
                        class="w-4 h-4 text-gray-300"
                      />
                      <Icon
                        v-else
                        name="heroicons:command-line"
                        class="w-4 h-4 text-gray-300"
                      />
                    </div>
                    <div>
                      <div class="font-medium text-white">{{ command.name }}</div>
                      <div class="text-sm text-gray-400">{{ command.description }}</div>
                    </div>
                  </div>
                  
                  <div v-if="command.shortcut" class="text-xs text-gray-500 bg-white/5 rounded border border-white/10" style="padding: 0.25rem 0.5rem;">
                    {{ command.shortcut }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-3 border-t border-white/10 bg-white/5">
            <div class="flex justify-between text-xs text-gray-400">
              <span>Press <kbd class="kbd">↑↓</kbd> to navigate</span>
              <span>Press <kbd class="kbd">Enter</kbd> to execute</span>
              <span>Press <kbd class="kbd">Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Command } from '~/types/commands'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { searchCommands } = useCommands()

const searchQuery = ref('')
const selectedIndex = ref(0)
const searchInput = ref<HTMLInputElement>()

const filteredCommands = computed(() => {
  return searchCommands(searchQuery.value)
})

const groupedCommands = computed(() => {
  const groups: Record<string, Command[]> = {}
  
  filteredCommands.value.forEach(command => {
    const category = command.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(command)
  })
  
  return groups
})

const totalCommands = computed(() => {
  return Object.values(groupedCommands.value).flat().length
})

const getGlobalIndex = (category: string, localIndex: number): number => {
  let globalIndex = 0
  const categories = Object.keys(groupedCommands.value)
  
  for (const cat of categories) {
    if (cat === category) {
      return globalIndex + localIndex
    }
    globalIndex += groupedCommands.value[cat].length
  }
  
  return globalIndex
}

const getCommandByGlobalIndex = (globalIndex: number): Command | null => {
  let currentIndex = 0
  
  for (const [category, commands] of Object.entries(groupedCommands.value)) {
    if (globalIndex < currentIndex + commands.length) {
      return commands[globalIndex - currentIndex]
    }
    currentIndex += commands.length
  }
  
  return null
}

const executeCommand = (command: Command) => {
  command.action()
  emit('close')
}

const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, totalCommands.value - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
      event.preventDefault()
      const command = getCommandByGlobalIndex(selectedIndex.value)
      if (command) {
        executeCommand(command)
      }
      break
    case 'Escape':
      event.preventDefault()
      emit('close')
      break
  }
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      searchInput.value?.focus()
    })
    selectedIndex.value = 0
  } else {
    searchQuery.value = ''
  }
})

watch(filteredCommands, () => {
  selectedIndex.value = 0
})
</script>

<style scoped>
.glass-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.kbd {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
}
</style>