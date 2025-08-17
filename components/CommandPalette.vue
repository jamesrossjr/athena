<script setup lang="ts">
import { useCommandPaletteStore } from '~/stores/commandPalette'

const store = useCommandPaletteStore()

const groups = computed(() => [
  { 
    key: 'commands', 
    commands: store.filteredCommands 
  }
])

function onSelect(command: any) {
  console.log('Selected command:', command)
  
  // Handle different command actions
  switch (command.action) {
    case 'goto-demo':
      navigateTo('/demo')
      break
      
    case 'goto-graph':
      navigateTo('/graph')
      break
      
    case 'goto-plugins':
      navigateTo('/plugins')
      break
      
    case 'goto-templates':
      navigateTo('/templates')
      break
      
    case 'goto-import':
      navigateTo('/import')
      break
      
    case 'goto-pricing':
      navigateTo('/pricing')
      break
      
    case 'goto-admin':
      navigateTo('/admin/dashboard')
      break
      
    case 'ai-summarize':
      handleAISummarize()
      break
      
    case 'ai-search':
      handleAISearch()
      break
      
    case 'ai-improve':
    case 'ai-grammar':
    case 'ai-translate':
    case 'ai-simplify':
      handleTextImprovement(command.action)
      break
      
    default:
      console.log('Command not implemented:', command.action)
  }
  
  store.close()
}

async function handleAISummarize() {
  // Get current page content (this would be context-aware in a real implementation)
  const route = useRoute()
  if (route.path.startsWith('/document/')) {
    const documentId = route.params.id
    // This would get the actual document content
    console.log('Summarizing document:', documentId)
    // For demo, show a toast
    const toast = useToast()
    toast.add({
      title: 'AI Summary',
      description: 'Generating summary of your document...',
      icon: 'i-heroicons-sparkles'
    })
  }
}

async function handleAISearch() {
  const route = useRoute()
  if (route.path.startsWith('/document/')) {
    const toast = useToast()
    toast.add({
      title: 'AI Search',
      description: 'Finding related documents...',
      icon: 'i-heroicons-magnifying-glass'
    })
  }
}

function handleTextImprovement(action: string) {
  const toast = useToast()
  const actionNames = {
    'ai-improve': 'Improving text',
    'ai-grammar': 'Fixing grammar',
    'ai-translate': 'Translating text', 
    'ai-simplify': 'Simplifying text'
  }
  
  toast.add({
    title: 'AI Assistant',
    description: actionNames[action as keyof typeof actionNames] || 'Processing text...',
    icon: 'i-heroicons-sparkles'
  })
}

function onClose() {
  store.close()
}
</script>

<template>
  <UCommandPalette
    v-model="store.searchQuery"
    placeholder="Search or type a command..."
    :groups="groups"
    @select="onSelect"
    @close="onClose"
  />
</template>