<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
      
      <!-- Command Palette -->
      <div class="relative min-h-screen flex items-start justify-center pt-20 px-4">
        <div class="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800">
          <!-- Search Input -->
          <div class="border-b border-gray-200 dark:border-gray-800">
            <div class="flex items-center px-4">
              <Icon name="heroicons:magnifying-glass" class="h-5 w-5 text-gray-400" />
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Type a command or search..."
                class="flex-1 px-3 py-4 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
                @keydown.escape="$emit('close')"
                @keydown.enter="executeCommand(filteredCommands[selectedIndex])"
                @keydown.up.prevent="navigateUp"
                @keydown.down.prevent="navigateDown"
              />
              <kbd class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">ESC</kbd>
            </div>
          </div>

          <!-- Commands List -->
          <div class="max-h-96 overflow-y-auto py-2">
            <div v-if="filteredCommands.length === 0" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No commands found
            </div>
            
            <div v-else>
              <div
                v-for="(command, index) in filteredCommands"
                :key="command.id"
                @click="executeCommand(command)"
                @mouseenter="selectedIndex = index"
                class="px-4 py-2 cursor-pointer transition-colors"
                :class="selectedIndex === index 
                  ? 'bg-gray-100 dark:bg-gray-800' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Icon :name="command.icon" class="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">{{ command.title }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{{ command.description }}</div>
                    </div>
                  </div>
                  <div v-if="command.shortcut" class="flex items-center space-x-1">
                    <kbd v-for="key in command.shortcut.split('+')" :key="key" class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">
                      {{ key }}
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-200 dark:border-gray-800 px-4 py-2">
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div class="flex items-center space-x-4">
                <span class="flex items-center space-x-1">
                  <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑</kbd>
                  <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↓</kbd>
                  <span>Navigate</span>
                </span>
                <span class="flex items-center space-x-1">
                  <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
                  <span>Select</span>
                </span>
              </div>
              <div>
                {{ filteredCommands.length }} results
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const emit = defineEmits(['close'])
const searchInput = ref(null)
const searchQuery = ref('')
const selectedIndex = ref(0)

// All available commands
const commands = ref([
  // Quick Actions
  { id: 1, title: 'New Note', description: 'Create a new note', icon: 'heroicons:document-plus', category: 'quick', shortcut: '⌘+N' },
  { id: 2, title: 'New Task', description: 'Create a new task', icon: 'heroicons:plus-circle', category: 'quick' },
  { id: 3, title: 'New Project', description: 'Create a new project', icon: 'heroicons:folder-plus', category: 'quick' },
  
  // Navigation
  { id: 4, title: 'Go to Dashboard', description: 'Navigate to dashboard', icon: 'heroicons:home', category: 'navigation' },
  { id: 5, title: 'Go to Notes', description: 'View all notes', icon: 'heroicons:document-text', category: 'navigation' },
  { id: 6, title: 'Go to Tasks', description: 'View all tasks', icon: 'heroicons:check-circle', category: 'navigation' },
  { id: 7, title: 'Go to Knowledge Graph', description: 'View knowledge connections', icon: 'heroicons:globe-alt', category: 'navigation' },
  
  // Search
  { id: 8, title: 'Search Notes', description: 'Search through all notes', icon: 'heroicons:magnifying-glass', category: 'search' },
  { id: 9, title: 'Search by Tag', description: 'Filter by tags', icon: 'heroicons:tag', category: 'search' },
  { id: 10, title: 'Search by Date', description: 'Filter by date range', icon: 'heroicons:calendar', category: 'search' },
  
  // AI Actions
  { id: 11, title: 'Ask ATHENA', description: 'Get AI assistance', icon: 'heroicons:sparkles', category: 'ai', shortcut: '⌘+/' },
  { id: 12, title: 'Generate Summary', description: 'AI-powered summary', icon: 'heroicons:document-duplicate', category: 'ai' },
  { id: 13, title: 'Find Connections', description: 'Discover related content', icon: 'heroicons:link', category: 'ai' },
  { id: 14, title: 'Smart Organize', description: 'AI-powered organization', icon: 'heroicons:squares-2x2', category: 'ai' },
  
  // Settings
  { id: 15, title: 'Preferences', description: 'Open preferences', icon: 'heroicons:cog-6-tooth', category: 'settings', shortcut: '⌘+,' },
  { id: 16, title: 'Toggle Dark Mode', description: 'Switch theme', icon: 'heroicons:moon', category: 'settings' },
  { id: 17, title: 'Export Data', description: 'Export your data', icon: 'heroicons:arrow-down-tray', category: 'settings' },
  { id: 18, title: 'Import Data', description: 'Import from other tools', icon: 'heroicons:arrow-up-tray', category: 'settings' }
])

// Filter commands based on search
const filteredCommands = computed(() => {
  if (!searchQuery.value) return commands.value
  
  const query = searchQuery.value.toLowerCase()
  return commands.value.filter(cmd => 
    cmd.title.toLowerCase().includes(query) ||
    cmd.description.toLowerCase().includes(query) ||
    cmd.category.toLowerCase().includes(query)
  )
})

// Reset selected index when search changes
watch(searchQuery, () => {
  selectedIndex.value = 0
})

// Navigation methods
const navigateUp = () => {
  if (selectedIndex.value > 0) {
    selectedIndex.value--
  } else {
    selectedIndex.value = filteredCommands.value.length - 1
  }
}

const navigateDown = () => {
  if (selectedIndex.value < filteredCommands.value.length - 1) {
    selectedIndex.value++
  } else {
    selectedIndex.value = 0
  }
}

// Execute command
const executeCommand = (command) => {
  if (!command) return
  
  // Handle different command types
  switch (command.category) {
    case 'navigation':
      // Navigate to page
      console.log('Navigate to:', command.title)
      break
    case 'quick':
      // Create new item
      console.log('Create:', command.title)
      break
    case 'ai':
      // AI action
      console.log('AI action:', command.title)
      break
    default:
      console.log('Execute command:', command.title)
  }
  
  emit('close')
}

// Focus input on mount
onMounted(() => {
  searchInput.value?.focus()
})
</script>