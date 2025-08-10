<template>
  <div class="pdf-viewer-container h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- PDF Controls Bar -->
    <div class="pdf-controls flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <!-- Page Navigation -->
        <button
          @click="previousPage"
          :disabled="currentPage <= 1"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div class="flex items-center gap-2">
          <input
            type="number"
            v-model.number="currentPage"
            @change="goToPage"
            :min="1"
            :max="totalPages"
            class="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
          <span class="text-sm text-gray-600 dark:text-gray-400">/ {{ totalPages }}</span>
        </div>
        
        <button
          @click="nextPage"
          :disabled="currentPage >= totalPages"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <!-- Zoom Controls -->
      <div class="flex items-center gap-2">
        <button
          @click="zoomOut"
          :disabled="scale <= 0.5"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Zoom Out"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
        
        <select
          v-model="scale"
          @change="setZoom"
          class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
        >
          <option :value="0.5">50%</option>
          <option :value="0.75">75%</option>
          <option :value="1">100%</option>
          <option :value="1.25">125%</option>
          <option :value="1.5">150%</option>
          <option :value="2">200%</option>
          <option value="page-width">Fit Width</option>
          <option value="page-fit">Fit Page</option>
        </select>
        
        <button
          @click="zoomIn"
          :disabled="scale >= 3"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Zoom In"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </button>
      </div>
      
      <!-- Additional Controls -->
      <div class="flex items-center gap-2">
        <button
          @click="rotateLeft"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Rotate Left"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4v5h5M6 13a9 9 0 0011.12 8.755M21 12a9 9 0 00-9-9" />
          </svg>
        </button>
        
        <button
          @click="rotateRight"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Rotate Right"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 20v-5h-5M18 11a9 9 0 00-11.12-8.755M3 12a9 9 0 009 9" />
          </svg>
        </button>
        
        <button
          @click="downloadPdf"
          class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Download PDF"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- PDF Canvas Container -->
    <div 
      ref="pdfContainer"
      class="pdf-canvas-container flex-1 overflow-auto p-4"
      @scroll="handleScroll"
    >
      <div class="pdf-canvas-wrapper flex justify-center">
        <canvas
          ref="pdfCanvas"
          class="pdf-canvas shadow-lg"
          :style="{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease'
          }"
        ></canvas>
      </div>
    </div>
    
    <!-- Loading Indicator -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
      <div class="flex flex-col items-center gap-2">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="text-sm text-gray-600 dark:text-gray-400">Loading PDF...</span>
      </div>
    </div>
    
    <!-- Error Message -->
    <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
      <div class="text-center">
        <svg class="w-12 h-12 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const props = defineProps<{
  documentId?: string
  pdfUrl?: string
  pdfData?: string // Base64 encoded PDF data
}>()

// Refs
const pdfCanvas = ref<HTMLCanvasElement>()
const pdfContainer = ref<HTMLDivElement>()

// State
const loading = ref(true)
const error = ref('')
const pdfDoc = ref<any>(null)
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref<number | string>(1)
const rotation = ref(0)
const pageRendering = ref(false)
const pageNumPending = ref<number | null>(null)

// Load PDF
const loadPdf = async () => {
  loading.value = true
  error.value = ''
  
  try {
    let loadingTask
    
    if (props.pdfData) {
      // Load from base64 data
      const pdfDataBytes = atob(props.pdfData)
      const uint8Array = new Uint8Array(pdfDataBytes.length)
      for (let i = 0; i < pdfDataBytes.length; i++) {
        uint8Array[i] = pdfDataBytes.charCodeAt(i)
      }
      loadingTask = pdfjsLib.getDocument({ data: uint8Array })
    } else if (props.pdfUrl) {
      // Load from URL
      loadingTask = pdfjsLib.getDocument(props.pdfUrl)
    } else if (props.documentId) {
      // Load from document ID
      const response = await $fetch(`/api/documents/${props.documentId}`)
      if (response.fileData) {
        const pdfDataBytes = atob(response.fileData)
        const uint8Array = new Uint8Array(pdfDataBytes.length)
        for (let i = 0; i < pdfDataBytes.length; i++) {
          uint8Array[i] = pdfDataBytes.charCodeAt(i)
        }
        loadingTask = pdfjsLib.getDocument({ data: uint8Array })
      } else {
        throw new Error('No PDF data found')
      }
    } else {
      throw new Error('No PDF source provided')
    }
    
    pdfDoc.value = await loadingTask.promise
    totalPages.value = pdfDoc.value.numPages
    
    // Render first page
    await renderPage(1)
    loading.value = false
  } catch (err: any) {
    error.value = err.message || 'Failed to load PDF'
    loading.value = false
  }
}

// Render a specific page
const renderPage = async (pageNumber: number) => {
  if (!pdfDoc.value || !pdfCanvas.value) return
  
  pageRendering.value = true
  
  try {
    const page = await pdfDoc.value.getPage(pageNumber)
    
    let viewport
    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d')
    
    if (!context) throw new Error('Failed to get canvas context')
    
    // Calculate scale based on container width if set to fit
    if (scale.value === 'page-width' && pdfContainer.value) {
      const containerWidth = pdfContainer.value.clientWidth - 32 // Subtract padding
      const pageViewport = page.getViewport({ scale: 1, rotation: rotation.value })
      const fitScale = containerWidth / pageViewport.width
      viewport = page.getViewport({ scale: fitScale, rotation: rotation.value })
    } else if (scale.value === 'page-fit' && pdfContainer.value) {
      const containerWidth = pdfContainer.value.clientWidth - 32
      const containerHeight = pdfContainer.value.clientHeight - 32
      const pageViewport = page.getViewport({ scale: 1, rotation: rotation.value })
      const fitScaleWidth = containerWidth / pageViewport.width
      const fitScaleHeight = containerHeight / pageViewport.height
      const fitScale = Math.min(fitScaleWidth, fitScaleHeight)
      viewport = page.getViewport({ scale: fitScale, rotation: rotation.value })
    } else {
      viewport = page.getViewport({ scale: scale.value as number, rotation: rotation.value })
    }
    
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }
    
    await page.render(renderContext).promise
    
    pageRendering.value = false
    
    // If there's a pending page, render it
    if (pageNumPending.value !== null) {
      const pending = pageNumPending.value
      pageNumPending.value = null
      await renderPage(pending)
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to render page'
    pageRendering.value = false
  }
}

// Queue page rendering
const queueRenderPage = (pageNumber: number) => {
  if (pageRendering.value) {
    pageNumPending.value = pageNumber
  } else {
    renderPage(pageNumber)
  }
}

// Navigation functions
const previousPage = () => {
  if (currentPage.value <= 1) return
  currentPage.value--
  queueRenderPage(currentPage.value)
}

const nextPage = () => {
  if (currentPage.value >= totalPages.value) return
  currentPage.value++
  queueRenderPage(currentPage.value)
}

const goToPage = () => {
  const page = parseInt(currentPage.value.toString())
  if (page < 1) {
    currentPage.value = 1
  } else if (page > totalPages.value) {
    currentPage.value = totalPages.value
  }
  queueRenderPage(currentPage.value)
}

// Zoom functions
const zoomIn = () => {
  if (typeof scale.value === 'number' && scale.value < 3) {
    scale.value = Math.min(scale.value + 0.25, 3)
    queueRenderPage(currentPage.value)
  }
}

const zoomOut = () => {
  if (typeof scale.value === 'number' && scale.value > 0.5) {
    scale.value = Math.max(scale.value - 0.25, 0.5)
    queueRenderPage(currentPage.value)
  }
}

const setZoom = () => {
  queueRenderPage(currentPage.value)
}

// Rotation functions
const rotateLeft = () => {
  rotation.value = (rotation.value - 90) % 360
  queueRenderPage(currentPage.value)
}

const rotateRight = () => {
  rotation.value = (rotation.value + 90) % 360
  queueRenderPage(currentPage.value)
}

// Download function
const downloadPdf = async () => {
  try {
    if (props.documentId) {
      const response = await $fetch(`/api/documents/${props.documentId}`)
      if (response.fileData) {
        const blob = new Blob([atob(response.fileData)], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.fileName || 'document.pdf'
        a.click()
        URL.revokeObjectURL(url)
      }
    } else if (props.pdfUrl) {
      const a = document.createElement('a')
      a.href = props.pdfUrl
      a.download = 'document.pdf'
      a.click()
    }
  } catch (err: any) {
    error.value = 'Failed to download PDF'
  }
}

// Handle scroll for multi-page PDFs (future enhancement)
const handleScroll = () => {
  // Could implement continuous scrolling through pages here
}

// Handle window resize
const handleResize = () => {
  if (scale.value === 'page-width' || scale.value === 'page-fit') {
    queueRenderPage(currentPage.value)
  }
}

// Lifecycle
onMounted(() => {
  loadPdf()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (pdfDoc.value) {
    pdfDoc.value.destroy()
  }
})

// Watch for prop changes
watch(() => [props.documentId, props.pdfUrl, props.pdfData], () => {
  loadPdf()
})
</script>

<style scoped>
.pdf-viewer-container {
  position: relative;
}

.pdf-canvas-container {
  background: repeating-linear-gradient(
    45deg,
    #f9fafb,
    #f9fafb 10px,
    #f3f4f6 10px,
    #f3f4f6 20px
  );
}

.dark .pdf-canvas-container {
  background: repeating-linear-gradient(
    45deg,
    #1f2937,
    #1f2937 10px,
    #111827 10px,
    #111827 20px
  );
}

.pdf-canvas {
  background: white;
  max-width: 100%;
  height: auto;
}
</style>