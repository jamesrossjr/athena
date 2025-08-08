<template>
  <div class="relative">
    <UButton
      variant="outline"
      size="sm"
      icon="i-heroicons-magnifying-glass"
      @click="searchOpen = true"
    >
      Search
      <span class="ml-2 text-xs text-gray-400">⌘K</span>
    </UButton>
    
    <UModal v-model="searchOpen" :ui="{ width: 'w-full max-w-2xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Search Knowledge</h3>
            <UButton
              variant="ghost"
              size="sm"
              icon="i-heroicons-x-mark"
              @click="searchOpen = false"
            />
          </div>
        </template>
        
        <div class="space-y-4">
          <UInput
            v-model="searchQuery"
            placeholder="Search notes, tasks, and more..."
            icon="i-heroicons-magnifying-glass"
            size="lg"
            autofocus
          />
          
          <div v-if="searchResults.length > 0" class="space-y-2">
            <div
              v-for="result in searchResults"
              :key="result.id"
              class="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              @click="selectResult(result)"
            >
              <div class="font-medium">{{ result.title }}</div>
              <div class="text-sm text-gray-500">{{ result.excerpt }}</div>
              <div class="text-xs text-gray-400 mt-1">{{ result.type }}</div>
            </div>
          </div>
          
          <div v-else-if="searchQuery" class="text-center py-8 text-gray-500">
            No results found for "{{ searchQuery }}"
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
const searchOpen = ref(false)
const searchQuery = ref('')

// Mock search results for now
const searchResults = computed(() => {
  if (!searchQuery.value) return []
  
  return [
    {
      id: '1',
      title: 'Project Planning Notes',
      excerpt: 'Key insights on project management and planning strategies...',
      type: 'Note'
    },
    {
      id: '2', 
      title: 'AI Implementation Task',
      excerpt: 'Implement RAG pipeline for knowledge retrieval...',
      type: 'Task'
    }
  ]
})

const selectResult = (result) => {
  // Navigate to result
  searchOpen.value = false
  searchQuery.value = ''
}

// Global search shortcut
useKeyboard({
  'meta+k': () => {
    searchOpen.value = true
  }
})
</script>