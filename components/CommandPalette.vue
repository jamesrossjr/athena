<template>
  <UModal :model-value="isOpen" @update:model-value="handleClose">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Command Palette</h3>
      </template>
      
      <div class="space-y-4">
        <UInput
          v-model="query"
          placeholder="Type a command or search..."
          size="lg"
          icon="i-heroicons-magnifying-glass"
          autofocus
          @keydown.enter="executeCommand"
        />
        
        <div v-if="filteredCommands.length" class="max-h-80 overflow-y-auto">
          <div
            v-for="(command, index) in filteredCommands"
            :key="command.id"
            class="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer rounded-lg"
            :class="{ 'bg-gray-100 dark:bg-gray-700': selectedIndex === index }"
            @click="selectCommand(command)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <UIcon :name="command.icon" class="w-5 h-5" />
                <div>
                  <p class="font-medium">{{ command.label }}</p>
                  <p class="text-sm text-gray-500">{{ command.description }}</p>
                </div>
              </div>
              <UKbd v-if="command.shortcut">{{ command.shortcut }}</UKbd>
            </div>
          </div>
        </div>
        
        <div v-else-if="query" class="text-center py-8 text-gray-500">
          No commands found for "{{ query }}"
        </div>
        
        <div v-else class="text-center py-4 text-sm text-gray-500">
          Start typing to search commands...
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, readonly } from 'vue'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const query = ref('')
const selectedIndex = ref(0)

// Define available commands
const commands = ref([
  {
    id: 'ai-assistant',
    label: 'Open AI Assistant',
    description: 'Access Jarvis AI assistant',
    icon: 'i-heroicons-cpu-chip',
    action: () => navigateTo('/ai'),
    shortcut: 'Ctrl+J'
  },
  {
    id: 'new-document',
    label: 'New Document',
    description: 'Create a new document',
    icon: 'i-heroicons-document-plus',
    action: () => console.log('New document'),
    shortcut: 'Ctrl+N'
  },
  {
    id: 'search-documents',
    label: 'Search Documents',
    description: 'Search through your documents',
    icon: 'i-heroicons-magnifying-glass',
    action: () => console.log('Search documents'),
    shortcut: 'Ctrl+K'
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Open application settings',
    icon: 'i-heroicons-cog-6-tooth',
    action: () => console.log('Settings'),
    shortcut: 'Ctrl+,'
  }
])

// Filter commands based on query
const filteredCommands = computed(() => {
  if (!query.value) return commands.value
  
  return commands.value.filter(command => 
    command.label.toLowerCase().includes(query.value.toLowerCase()) ||
    command.description.toLowerCase().includes(query.value.toLowerCase())
  )
})

// Handle modal close
const handleClose = (value: boolean) => {
  if (!value) {
    emit('close')
  }
}

// Watch for open state changes
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    query.value = ''
    selectedIndex.value = 0
  }
})

// Execute selected command
const executeCommand = () => {
  if (filteredCommands.value.length > 0) {
    selectCommand(filteredCommands.value[selectedIndex.value])
  }
}

// Select and execute command
const selectCommand = (command: any) => {
  command.action()
  emit('close')
}

// Handle keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isOpen) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Escape':
      emit('close')
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>