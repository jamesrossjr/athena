<script setup lang="ts">
const route = useRoute()
const documentId = route.params.id as string

// Fetch document data
const { data: document, pending, error } = await useFetch(`/api/documents/${documentId}`)

// WebSocket connection for real-time features
const { isConnected, users, sendContentChange } = useWebSocket(documentId, 'demo-user')

// Define editor components mapping
const editors = {
  PAGE: resolveComponent('EditorsCollaborativeTextEditor'),
  WHITEBOARD: resolveComponent('EditorsWhiteboardEditor'),
  DATABASE: resolveComponent('EditorsDatabaseEditor')
}

// Get current editor component
const currentEditor = computed(() => {
  if (!document.value?.type) return null
  return editors[document.value.type as keyof typeof editors]
})

// Handle content updates
async function handleContentUpdate(newContent: any) {
  try {
    // Save to database
    await $fetch(`/api/documents/${documentId}`, {
      method: 'PUT',
      body: {
        content: newContent
      }
    })
    
    // Broadcast change via WebSocket
    sendContentChange(newContent)
  } catch (error) {
    console.error('Failed to save document:', error)
  }
}

// Set page title
useHead({
  title: computed(() => document.value?.title ? `${document.value.title} - Athena` : 'Loading...')
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Loading state -->
    <div v-if="pending" class="flex items-center justify-center h-64">
      <div class="text-gray-500">Loading document...</div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="flex items-center justify-center h-64">
      <div class="text-red-500">
        Error loading document: {{ error.statusMessage || 'Unknown error' }}
      </div>
    </div>
    
    <!-- Document content -->
    <div v-else-if="document" class="flex flex-col h-screen">
      <!-- Header -->
      <header class="border-b border-gray-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">{{ document.title }}</h1>
            <div class="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span class="capitalize">{{ document.type.toLowerCase() }}</span>
              <span>•</span>
              <span>{{ document.workspace.name }}</span>
              <span>•</span>
              <span>Last updated {{ new Date(document.updatedAt).toLocaleDateString() }}</span>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Connection Status -->
            <UBadge :color="isConnected ? 'green' : 'gray'" variant="soft">
              {{ isConnected ? '🟢 Live' : '🔴 Offline' }}
            </UBadge>
            
            <!-- Active Users -->
            <UBadge v-if="users.size > 0" color="blue" variant="soft">
              {{ users.size }} other{{ users.size === 1 ? '' : 's' }} online
            </UBadge>
            
            <!-- Document Type -->
            <UBadge :color="document.type === 'PAGE' ? 'blue' : document.type === 'WHITEBOARD' ? 'green' : 'purple'">
              {{ document.type }}
            </UBadge>
          </div>
        </div>
      </header>
      
      <!-- Editor -->
      <main class="flex-1 overflow-auto">
        <component
          :is="currentEditor"
          v-if="currentEditor"
          :content="document.content"
          :document-id="documentId"
          @update="handleContentUpdate"
        />
        <div v-else class="flex items-center justify-center h-64">
          <div class="text-gray-500">Unknown document type: {{ document.type }}</div>
        </div>
      </main>
    </div>
  </div>
</template>