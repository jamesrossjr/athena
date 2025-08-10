<template>
  <div class="document-renderer h-full">
    <!-- Page Type - Standard markdown/text editor -->
    <PageEditor
      v-if="document.type === 'page'"
      ref="pageEditor"
      :document="document"
      @update="$emit('update', $event)"
      @slash-command="$emit('slash-command', $event)"
    />
    
    <!-- Table Type - Spreadsheet-like grid -->
    <TableEditor
      v-else-if="document.type === 'table'"
      :document="document"
      @update="$emit('update', $event)"
    />
    
    <!-- Whiteboard Type - Infinite canvas with drawing tools -->
    <WhiteboardEditor
      v-else-if="document.type === 'whiteboard'"
      :document="document"
      @update="$emit('update', $event)"
    />
    
    <!-- Database Type - Structured database interface -->
    <DatabaseEditor
      v-else-if="document.type === 'database'"
      :document="document"
      @update="$emit('update', $event)"
    />
    
    <!-- PDF Type - PDF Viewer with controls -->
    <PdfViewer
      v-else-if="document.type === 'pdf'"
      :document-id="document.id"
      :pdf-data="document.fileData"
    />
    
    <!-- Fallback for unknown types -->
    <div v-else class="flex items-center justify-center h-full text-gray-500">
      <div class="text-center">
        <div class="text-4xl mb-4">❓</div>
        <h2 class="text-xl font-semibold mb-2">Unknown Document Type</h2>
        <p>Document type "{{ document.type }}" is not supported.</p>
        <button 
          @click="$emit('update', { ...document, type: 'page' })"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Convert to Page
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  document: {
    type: Object,
    required: true
  }
})

defineEmits(['update', 'slash-command'])
</script>