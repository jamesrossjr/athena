<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Vault</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Your personal knowledge repository
        </p>
      </div>
      
      <div class="flex space-x-2">
        <UButton icon="i-heroicons-plus" @click="createNote">
          New Note
        </UButton>
        <UButton variant="outline" icon="i-heroicons-folder-plus" @click="createFolder">
          New Folder
        </UButton>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Vault Browser -->
      <div class="lg:col-span-1">
        <VaultBrowser @select="selectNote" />
      </div>
      
      <!-- Note Editor/Viewer -->
      <div class="lg:col-span-2">
        <NoteEditor v-if="selectedNote" :note="selectedNote" @save="saveNote" />
        <div v-else class="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <div class="text-center">
            <Icon name="heroicons:document-text" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p class="text-lg font-medium text-gray-900 dark:text-white">No note selected</p>
            <p class="text-gray-500">Select a note from the vault or create a new one</p>
          </div>
        </div>
      </div>
      
      <!-- Graph View -->
      <div class="lg:col-span-1">
        <GraphView :selected-note="selectedNote" />
      </div>
    </div>
  </div>
</template>

<script setup>
const selectedNote = ref(null)

const selectNote = (note) => {
  selectedNote.value = note
}

const saveNote = (note) => {
  // TODO: Implement note saving
  console.log('Saving note:', note)
}

const createNote = () => {
  // TODO: Implement note creation
  selectedNote.value = {
    id: Date.now(),
    title: 'Untitled Note',
    content: '',
    created: new Date(),
    updated: new Date()
  }
}

const createFolder = () => {
  // TODO: Implement folder creation
  console.log('Creating folder')
}
</script>