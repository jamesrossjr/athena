<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-8">Athena Demo</h1>
    
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">📄 Text Document</h3>
        </template>
        <p class="text-gray-600 mb-4">Rich text editing with real-time collaboration</p>
        <UButton @click="createDocument('PAGE')" block>Create Text Document</UButton>
      </UCard>
      
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">🎨 Whiteboard</h3>
        </template>
        <p class="text-gray-600 mb-4">Visual collaboration with shapes and drawings</p>
        <UButton @click="createDocument('WHITEBOARD')" block color="green">Create Whiteboard</UButton>
      </UCard>
      
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">🗃️ Database</h3>
        </template>
        <p class="text-gray-600 mb-4">Structured data with tables and views</p>
        <UButton @click="createDocument('DATABASE')" block color="purple">Create Database</UButton>
      </UCard>
    </div>
    
    <div v-if="isLoading" class="mt-8 text-center">
      <p class="text-gray-500">Creating document...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const isLoading = ref(false)

async function createDocument(type: 'PAGE' | 'WHITEBOARD' | 'DATABASE') {
  isLoading.value = true
  
  try {
    // First create a demo workspace if needed
    const workspace = await $fetch('/api/workspaces/create', {
      method: 'POST',
      body: {
        name: 'Demo Workspace',
        ownerId: 'demo-user' // In a real app, this would be the authenticated user ID
      }
    }).catch(async () => {
      // If workspace creation fails, it might already exist, so let's use a default one
      return { id: 'demo-workspace-id' }
    })
    
    // Create the document
    const document = await $fetch('/api/documents/create', {
      method: 'POST',
      body: {
        title: `New ${type.toLowerCase()} document`,
        type,
        workspaceId: workspace.id,
        content: getDefaultContent(type)
      }
    })
    
    // Navigate to the document
    await navigateTo(`/document/${document.id}`)
  } catch (error) {
    console.error('Failed to create document:', error)
    alert('Failed to create document. Please try again.')
  } finally {
    isLoading.value = false
  }
}

function getDefaultContent(type: 'PAGE' | 'WHITEBOARD' | 'DATABASE') {
  switch (type) {
    case 'PAGE':
      return 'Welcome to your new document! Start typing here...'
    case 'WHITEBOARD':
      return { elements: [] }
    case 'DATABASE':
      return {
        columns: [
          { id: 1, name: 'Task', type: 'text' },
          { id: 2, name: 'Status', type: 'select' },
          { id: 3, name: 'Due Date', type: 'date' }
        ],
        rows: []
      }
    default:
      return null
  }
}

useHead({
  title: 'Demo - Athena'
})
</script>