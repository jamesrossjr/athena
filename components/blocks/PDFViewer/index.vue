<template>
  <div class="pdf-viewer-block">
    <!-- PDF Viewer Interface -->
    <div class="pdf-container">
      <!-- PDF Toolbar -->
      <div class="pdf-toolbar" v-if="pdfUrl || uploadedFile">
        <div class="toolbar-section">
          <!-- Navigation -->
          <button 
            @click="previousPage" 
            :disabled="currentPage <= 1"
            class="nav-btn"
            title="Previous Page"
          >
            <span class="btn-icon">‹</span>
          </button>
          <div class="page-info">
            <input 
              v-model.number="currentPage" 
              @change="goToPage"
              type="number" 
              :min="1" 
              :max="totalPages"
              class="page-input"
            />
            <span class="page-separator">of</span>
            <span class="total-pages">{{ totalPages }}</span>
          </div>
          <button 
            @click="nextPage" 
            :disabled="currentPage >= totalPages"
            class="nav-btn"
            title="Next Page"
          >
            <span class="btn-icon">›</span>
          </button>
        </div>

        <div class="toolbar-section">
          <!-- Zoom Controls -->
          <button @click="zoomOut" class="zoom-btn" title="Zoom Out">
            <span class="btn-icon">−</span>
          </button>
          <select v-model="zoomLevel" @change="setZoom" class="zoom-select">
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1">100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
            <option value="2">200%</option>
            <option value="fit-width">Fit Width</option>
            <option value="fit-page">Fit Page</option>
          </select>
          <button @click="zoomIn" class="zoom-btn" title="Zoom In">
            <span class="btn-icon">+</span>
          </button>
        </div>

        <div class="toolbar-section">
          <!-- View Options -->
          <button 
            @click="toggleSidebar" 
            class="view-btn"
            :class="{ 'active': showSidebar }"
            title="Toggle Sidebar"
          >
            <span class="btn-icon">☰</span>
          </button>
          <button 
            @click="toggleFullscreen" 
            class="view-btn"
            title="Fullscreen"
          >
            <span class="btn-icon">⛶</span>
          </button>
        </div>

        <div class="toolbar-section">
          <!-- Actions -->
          <button @click="downloadPDF" class="action-btn" title="Download PDF">
            <span class="btn-icon">⬇</span>
            Download
          </button>
          <button @click="printPDF" class="action-btn" title="Print PDF">
            <span class="btn-icon">🖨</span>
            Print
          </button>
        </div>
      </div>

      <!-- PDF Upload Area -->
      <div v-if="!pdfUrl && !uploadedFile" class="upload-area">
        <div class="upload-content" @click="triggerFileInput">
          <div class="upload-icon">📄</div>
          <h3 class="upload-title">Add PDF Document</h3>
          <p class="upload-description">Click to browse or drag and drop a PDF file</p>
          <input 
            ref="fileInput"
            type="file"
            accept=".pdf,application/pdf"
            @change="handleFileUpload"
            class="file-input"
            hidden
          />
        </div>
        <div class="upload-options">
          <div class="option-divider">
            <span>or</span>
          </div>
          <div class="url-input-section">
            <input 
              v-model="urlInput" 
              @keyup.enter="loadFromURL"
              type="url"
              placeholder="Enter PDF URL..."
              class="url-input"
            />
            <button @click="loadFromURL" :disabled="!urlInput" class="load-btn">
              Load PDF
            </button>
          </div>
        </div>
      </div>

      <!-- PDF Viewer Content -->
      <div v-else class="pdf-viewer-content">
        <!-- Sidebar -->
        <div v-if="showSidebar" class="pdf-sidebar">
          <div class="sidebar-tabs">
            <button 
              @click="sidebarTab = 'thumbnails'" 
              :class="{ 'active': sidebarTab === 'thumbnails' }"
              class="sidebar-tab"
            >
              Thumbnails
            </button>
            <button 
              @click="sidebarTab = 'outline'" 
              :class="{ 'active': sidebarTab === 'outline' }"
              class="sidebar-tab"
            >
              Outline
            </button>
            <button 
              @click="sidebarTab = 'search'" 
              :class="{ 'active': sidebarTab === 'search' }"
              class="sidebar-tab"
            >
              Search
            </button>
          </div>

          <div class="sidebar-content">
            <!-- Thumbnails -->
            <div v-if="sidebarTab === 'thumbnails'" class="thumbnails-panel">
              <div 
                v-for="pageNum in totalPages" 
                :key="pageNum"
                @click="goToPage(pageNum)"
                class="thumbnail-item"
                :class="{ 'active': currentPage === pageNum }"
              >
                <div class="thumbnail-image">{{ pageNum }}</div>
                <div class="thumbnail-label">Page {{ pageNum }}</div>
              </div>
            </div>

            <!-- Outline -->
            <div v-else-if="sidebarTab === 'outline'" class="outline-panel">
              <div class="outline-item" v-for="item in outlineItems" :key="item.id">
                <a @click="goToPage(item.page)" class="outline-link">
                  {{ item.title }}
                </a>
              </div>
            </div>

            <!-- Search -->
            <div v-else-if="sidebarTab === 'search'" class="search-panel">
              <div class="search-input-container">
                <input 
                  v-model="searchQuery" 
                  @keyup.enter="searchPDF"
                  type="text"
                  placeholder="Search in PDF..."
                  class="search-input"
                />
                <button @click="searchPDF" class="search-btn">Search</button>
              </div>
              <div class="search-results">
                <div 
                  v-for="result in searchResults" 
                  :key="result.id"
                  @click="goToPage(result.page)"
                  class="search-result"
                >
                  <div class="result-page">Page {{ result.page }}</div>
                  <div class="result-text">{{ result.text }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main PDF Display -->
        <div class="pdf-main" :class="{ 'with-sidebar': showSidebar }">
          <div class="pdf-canvas-container" ref="canvasContainer">
            <!-- PDF Rendering would go here -->
            <div class="pdf-placeholder">
              <div class="pdf-page" :style="pageStyle">
                <div class="page-content">
                  <div v-if="isLoading" class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading PDF...</p>
                  </div>
                  <div v-else-if="error" class="error-message">
                    <div class="error-icon">⚠️</div>
                    <p>{{ error }}</p>
                    <button @click="retryLoad" class="retry-btn">Retry</button>
                  </div>
                  <div v-else class="pdf-page-display">
                    <h2>PDF Page {{ currentPage }}</h2>
                    <p>{{ fileName || 'PDF Document' }}</p>
                    <div class="mock-content">
                      <div class="mock-text-line"></div>
                      <div class="mock-text-line"></div>
                      <div class="mock-text-line short"></div>
                      <div class="mock-text-line"></div>
                      <div class="mock-text-line"></div>
                      <div class="mock-text-line short"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  blockId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update'])

// State
const pdfUrl = ref(props.data?.url || '')
const uploadedFile = ref(null)
const fileName = ref(props.data?.fileName || '')
const currentPage = ref(props.data?.currentPage || 1)
const totalPages = ref(props.data?.totalPages || 1)
const zoomLevel = ref(props.data?.zoomLevel || 1)
const showSidebar = ref(props.data?.showSidebar || false)
const sidebarTab = ref('thumbnails')
const isLoading = ref(false)
const error = ref('')
const urlInput = ref('')
const searchQuery = ref('')
const searchResults = ref([])

// Mock data
const outlineItems = ref([
  { id: '1', title: 'Introduction', page: 1 },
  { id: '2', title: 'Chapter 1', page: 3 },
  { id: '3', title: 'Chapter 2', page: 8 },
  { id: '4', title: 'Conclusion', page: 15 }
])

// Computed
const pageStyle = computed(() => {
  const scale = typeof zoomLevel.value === 'number' ? zoomLevel.value : 1
  return {
    transform: `scale(${scale})`,
    transformOrigin: 'top left'
  }
})

// Refs
const fileInput = ref(null)
const canvasContainer = ref(null)

// Methods
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  if (file.type !== 'application/pdf') {
    error.value = 'Please select a PDF file'
    return
  }

  isLoading.value = true
  error.value = ''
  
  try {
    uploadedFile.value = file
    fileName.value = file.name
    
    // Mock PDF loading
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    totalPages.value = Math.floor(Math.random() * 20) + 5 // Mock page count
    currentPage.value = 1
    
    emitUpdate()
  } catch (err) {
    error.value = 'Failed to load PDF file'
  } finally {
    isLoading.value = false
  }
}

async function loadFromURL() {
  if (!urlInput.value) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    pdfUrl.value = urlInput.value
    fileName.value = urlInput.value.split('/').pop() || 'PDF Document'
    
    // Mock PDF loading
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    totalPages.value = Math.floor(Math.random() * 30) + 10 // Mock page count
    currentPage.value = 1
    
    emitUpdate()
  } catch (err) {
    error.value = 'Failed to load PDF from URL'
  } finally {
    isLoading.value = false
  }
}

function retryLoad() {
  if (pdfUrl.value) {
    loadFromURL()
  } else if (uploadedFile.value) {
    // Retry file load
    isLoading.value = true
    setTimeout(() => {
      isLoading.value = false
      emitUpdate()
    }, 1000)
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    emitUpdate()
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    emitUpdate()
  }
}

function goToPage(page) {
  if (typeof page === 'number') {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value))
  } else {
    currentPage.value = Math.max(1, Math.min(currentPage.value, totalPages.value))
  }
  emitUpdate()
}

function zoomIn() {
  const currentZoom = typeof zoomLevel.value === 'number' ? zoomLevel.value : 1
  zoomLevel.value = Math.min(currentZoom + 0.25, 3)
  emitUpdate()
}

function zoomOut() {
  const currentZoom = typeof zoomLevel.value === 'number' ? zoomLevel.value : 1
  zoomLevel.value = Math.max(currentZoom - 0.25, 0.25)
  emitUpdate()
}

function setZoom() {
  emitUpdate()
}

function toggleSidebar() {
  showSidebar.value = !showSidebar.value
  emitUpdate()
}

function toggleFullscreen() {
  // Mock fullscreen toggle
  console.log('Toggle fullscreen')
}

function downloadPDF() {
  if (pdfUrl.value) {
    const link = document.createElement('a')
    link.href = pdfUrl.value
    link.download = fileName.value
    link.click()
  } else if (uploadedFile.value) {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(uploadedFile.value)
    link.download = fileName.value
    link.click()
  }
}

function printPDF() {
  if (pdfUrl.value) {
    window.open(pdfUrl.value, '_blank')
  }
}

function searchPDF() {
  if (!searchQuery.value) return
  
  // Mock search results
  searchResults.value = [
    { id: '1', page: 2, text: `...${searchQuery.value} appears in this context...` },
    { id: '2', page: 5, text: `Another occurrence of ${searchQuery.value} here...` },
    { id: '3', page: 12, text: `Final mention of ${searchQuery.value} in conclusion...` }
  ].filter(result => result.text.toLowerCase().includes(searchQuery.value.toLowerCase()))
}

function emitUpdate() {
  emit('update', {
    url: pdfUrl.value,
    fileName: fileName.value,
    currentPage: currentPage.value,
    totalPages: totalPages.value,
    zoomLevel: zoomLevel.value,
    showSidebar: showSidebar.value
  })
}

// Initialize
onMounted(() => {
  if (pdfUrl.value) {
    loadFromURL()
  }
})
</script>

<style scoped>
.pdf-viewer-block {
  width: 100%;
  height: 100%;
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  background: #f8f9fa;
}

.pdf-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* PDF Toolbar */
.pdf-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn, .zoom-btn, .view-btn, .action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled), 
.zoom-btn:hover, 
.view-btn:hover, 
.action-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.view-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-icon {
  font-size: 16px;
  font-weight: bold;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.page-separator {
  color: #6b7280;
  font-size: 14px;
}

.total-pages {
  color: #6b7280;
  font-size: 14px;
  min-width: 20px;
}

.zoom-select {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  min-width: 100px;
}

/* Upload Area */
.upload-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 400px;
  text-align: center;
}

.upload-content:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.upload-description {
  color: #6b7280;
  margin: 0;
}

.upload-options {
  margin-top: 32px;
  width: 100%;
  max-width: 400px;
}

.option-divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
  color: #6b7280;
}

.option-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
  z-index: 0;
}

.option-divider span {
  background: #f8f9fa;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

.url-input-section {
  display: flex;
  gap: 12px;
}

.url-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.load-btn {
  padding: 12px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.load-btn:hover:not(:disabled) {
  background: #2563eb;
}

.load-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* PDF Viewer Content */
.pdf-viewer-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Sidebar */
.pdf-sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-tab {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.sidebar-tab:hover {
  color: #374151;
  background: #f9fafb;
}

.sidebar-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: #f8fafc;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.thumbnails-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.thumbnail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.thumbnail-item:hover {
  background: #f3f4f6;
}

.thumbnail-item.active {
  background: #eff6ff;
  border: 1px solid #3b82f6;
}

.thumbnail-image {
  width: 40px;
  height: 56px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #6b7280;
}

.thumbnail-label {
  font-size: 14px;
  color: #374151;
}

.outline-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.outline-item {
  padding: 8px 0;
}

.outline-link {
  color: #3b82f6;
  text-decoration: none;
  cursor: pointer;
  font-size: 14px;
}

.outline-link:hover {
  text-decoration: underline;
}

.search-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-input-container {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
}

.search-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-result {
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.search-result:hover {
  background: #f1f5f9;
}

.result-page {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 600;
  margin-bottom: 4px;
}

.result-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
}

/* Main PDF Display */
.pdf-main {
  flex: 1;
  overflow: auto;
  background: #f8f9fa;
}

.pdf-main.with-sidebar {
  border-left: none;
}

.pdf-canvas-container {
  padding: 24px;
  display: flex;
  justify-content: center;
}

.pdf-placeholder {
  max-width: 100%;
}

.pdf-page {
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  width: 595px;
  min-height: 842px;
  transform-origin: top left;
}

.page-content {
  padding: 48px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
}

.retry-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.pdf-page-display {
  text-align: center;
  width: 100%;
}

.pdf-page-display h2 {
  font-size: 24px;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.pdf-page-display p {
  color: #6b7280;
  margin: 0 0 32px 0;
}

.mock-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.mock-text-line {
  height: 16px;
  background: #e5e7eb;
  border-radius: 4px;
}

.mock-text-line.short {
  width: 60%;
}

@media (max-width: 768px) {
  .pdf-sidebar {
    width: 250px;
  }
  
  .pdf-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .toolbar-section {
    justify-content: center;
  }
  
  .pdf-canvas-container {
    padding: 12px;
  }
  
  .pdf-page {
    width: 100%;
    max-width: 595px;
  }
}
</style>