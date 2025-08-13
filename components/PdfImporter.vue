<template>
  <div class="pdf-importer">
    <!-- File Input (hidden) -->
    <input
      ref="fileInput"
      type="file"
      accept="application/pdf,.pdf"
      @change="handleFileSelect"
      class="hidden"
    />
    
    <!-- Import Button -->
    <button
      @click="openFilewow "
      class="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
    >
      <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <div class="flex-1 text-left">
        <div class="font-medium text-gray-900 dark:text-white">PDF Document</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Import and view PDF files</div>
      </div>
    </button>
    
    <!-- Upload Progress Modal -->
    <div v-if="uploading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Importing PDF...</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ uploadStatus }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Error Modal -->
    <div v-if="error" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click="error = ''">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4" @click.stop>
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Import Failed</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ error }}</p>
          </div>
        </div>
        <button
          @click="error = ''"
          class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  imported: [document: any]
}>()

const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const uploadStatus = ref('Processing...')
const error = ref('')

const openFileDialog = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  if (file.type !== 'application/pdf') {
    error.value = 'Please select a valid PDF file'
    return
  }
  
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'File size must be less than 10MB'
    return
  }
  
  uploading.value = true
  uploadStatus.value = 'Uploading PDF...'
  
  try {
    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('title', file.name.replace(/\.pdf$/i, ''))
    
    const response = await $fetch('/api/documents/import-pdf', {
      method: 'POST',
      body: formData
    })
    
    if (response.success && response.document) {
      // Emit the imported document
      emit('imported', {
        id: response.document.id,
        title: response.document.title,
        type: 'pdf',
        fileName: response.document.fileName,
        fileSize: response.document.fileSize,
        createdAt: response.document.createdAt
      })
      
      uploadStatus.value = 'PDF imported successfully!'
      setTimeout(() => {
        uploading.value = false
      }, 1000)
    } else {
      throw new Error('Failed to import PDF')
    }
  } catch (err: any) {
    error.value = err.data?.statusMessage || err.message || 'Failed to import PDF'
    uploading.value = false
  }
  
  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>