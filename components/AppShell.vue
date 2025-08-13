<template>
  <div class="app-shell" :class="{ 'focus-mode': focusMode }">
    <!-- Main Content -->
    <main class="main-content">
      <div class="workspace-area" :class="`layout-${viewLayout}`">
        <div v-if="documents.length === 0" class="empty-state">
          <div class="empty-content">
            <div class="empty-icon">📄</div>
            <h2>Welcome to Athena</h2>
            <p>Press <kbd>Cmd+K</kbd> to get started</p>
          </div>
        </div>
        
        <div v-else class="documents-area">
          <div v-if="currentDocument" class="current-document">
            <EnhancedDocumentEditor
              :document="currentDocument"
              :focus-mode="focusMode"
              :is-high-contrast="isHighContrast"
              @update:document="updateCurrentDocument"
              @document-change="handleDocumentChange"
            />
          </div>
          <div v-else class="document-list">
            <KeyboardTooltip shortcut="Cmd+N" description="Create new document">
              <div v-for="doc in documents" :key="doc.id" class="document-item" @click="openDocument(doc)">
                <div class="document-header">
                  <input
                    v-if="doc.isEditing"
                    v-model="doc.title"
                    @blur="stopEditingTitle(doc)"
                    @keydown.enter="stopEditingTitle(doc)"
                    @keydown.escape="cancelEditTitle(doc)"
                    @click.stop
                    class="title-input"
                    ref="titleInput"
                  />
                  <h3 
                    v-else 
                    @click.stop="startEditingTitle(doc)"
                    class="document-title"
                    :title="'Click to rename'"
                  >
                    {{ doc.title }}
                  </h3>
                  <div class="document-type">{{ doc.type }}</div>
                </div>
                <div class="document-content">
                  <div v-if="doc.type === 'table'" class="table-preview">
                    📊 Table with {{ doc.content.rows?.length || 0 }} rows
                  </div>
                  <div v-else-if="doc.type === 'whiteboard'" class="whiteboard-preview">
                    🎨 Whiteboard
                  </div>
                  <div v-else class="page-preview">
                    📄 Document with {{ doc.content.blocks?.length || 0 }} blocks
                  </div>
                </div>
              </div>
            </KeyboardTooltip>
          </div>
        </div>
      </div>
    </main>
    
    <!-- Global Command System -->
    <CommandBar 
      @open-settings="openSettings"
      @toggle-theme="toggleTheme" 
      @toggle-focus-mode="toggleFocusMode"
      @set-tiling-layout="setTilingLayout"
      @create-document="createDocument"
      @save-document="saveDocument"
      @export-document="exportDocument"
      @open-search="openSearch"
      @show-recent="showRecentDocuments"
      @show-workspaces="showWorkspaces"
      @show-help="showHelp"
      @execute-command="handleGenericCommand"
      @open-ai-chat="openAiChat"
    />
    
    <!-- AI Chat Modal -->
    <AiChatModal
      :is-visible="aiChatVisible"
      :document-context="getDocumentContext()"
      @close="closeAiChat"
      @insert-text="insertTextIntoDocument"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import CommandBar from './CommandBar.vue'
import EnhancedDocumentEditor from './EnhancedDocumentEditor.vue'
import KeyboardTooltip from './KeyboardTooltip.vue'
import AiChatModal from './AiChatModal.vue'

// State
const documents = ref([])
const currentDocument = ref(null)
const viewLayout = ref('single')
const focusMode = ref(false)
const aiChatVisible = ref(false)
const isHighContrast = computed(() => {
  return document.documentElement.classList.contains('high-contrast')
})

// Clean setup
onMounted(() => {
  console.log('🚀 AppShell mounted with full CommandBar')
  
  // Set up global keyboard navigation
  document.addEventListener('keydown', handleGlobalKeydown)
})

// Global keyboard shortcuts
function handleGlobalKeydown(event) {
  // Escape key - close current document or exit focus mode
  if (event.key === 'Escape') {
    if (currentDocument.value) {
      closeCurrentDocument()
    } else if (focusMode.value) {
      focusMode.value = false
    }
    return
  }
  
  // Don't handle shortcuts if user is typing in an input or contenteditable
  if (event.target.tagName === 'INPUT' || 
      event.target.tagName === 'TEXTAREA' || 
      event.target.contentEditable === 'true') {
    return
  }
  
  // Handle accessibility shortcuts
  if (event.ctrlKey && event.shiftKey && event.key === 'H') {
    event.preventDefault()
    document.documentElement.classList.toggle('high-contrast')
  }
}

// Event handlers for CommandBar
const setTilingLayout = (layout) => {
  viewLayout.value = layout
  console.log(`📐 Set layout to: ${layout}`)
}

// Document management
function openDocument(doc) {
  currentDocument.value = doc
  console.log('📖 Opened document:', doc.title)
}

function updateCurrentDocument(updatedDocument) {
  currentDocument.value = updatedDocument
  // Also update in the documents list
  const index = documents.value.findIndex(doc => doc.id === updatedDocument.id)
  if (index !== -1) {
    documents.value[index] = updatedDocument
  }
}

function handleDocumentChange(document) {
  console.log('💾 Document changed:', document.title)
  // Auto-save could be implemented here
}

function closeCurrentDocument() {
  currentDocument.value = null
}

// Command implementations
const createDocument = (type = 'page') => {
  const newDoc = {
    id: Date.now().toString(),
    title: type === 'table' ? 'Untitled Table' : 
           type === 'whiteboard' ? 'Untitled Whiteboard' : 'Untitled Document',
    type: type,
    isEditing: false,
    originalTitle: '',
    content: type === 'table' 
      ? { rows: [{ cells: ['', '', ''] }] }
      : type === 'whiteboard'
      ? { elements: [] }
      : { 
        blocks: [
          { 
            id: Date.now().toString(), 
            type: 'paragraph', 
            content: '' 
          }
        ] 
      }
  }
  documents.value.push(newDoc)
  console.log(`✅ Created ${type} document:`, newDoc.title)
  
  // Open the new document immediately
  currentDocument.value = newDoc
  
  // Auto-start editing for new documents
  nextTick(() => {
    startEditingTitle(newDoc)
  })
}

const toggleFocusMode = () => {
  focusMode.value = !focusMode.value
  console.log('🎯 Focus mode:', focusMode.value)
}

const executeAiCommand = (type) => {
  console.log(`🤖 Execute AI command: ${type}`)
  // AI command implementation
}

const openSearch = () => {
  console.log('🔍 Open search')
}

const showRecentDocuments = () => {
  console.log('🕒 Show recent documents')
}

const openSettings = () => {
  console.log('⚙️ Open settings')
}

const toggleTheme = () => {
  console.log('🌓 Toggle theme')
  // Simple theme toggle implementation
  document.documentElement.classList.toggle('dark')
}

const saveDocument = () => {
  console.log('💾 Save document')
  // TODO: Implement document saving
}

const exportDocument = () => {
  console.log('📤 Export document')
  // TODO: Implement document export
}

const showWorkspaces = () => {
  console.log('🏗️ Show workspaces')
  // TODO: Implement workspace switcher
}

const showHelp = () => {
  console.log('❓ Show help')
  // TODO: Implement help modal
}

const handleGenericCommand = (command) => {
  console.log('🔧 Generic command:', command)
  // Handle any unmatched commands
}

// AI Chat Modal functions
function openAiChat() {
  aiChatVisible.value = true
  console.log('💬 Opened AI Chat Modal')
}

function closeAiChat() {
  aiChatVisible.value = false
  console.log('💬 Closed AI Chat Modal')
}

function getDocumentContext() {
  if (currentDocument.value) {
    return {
      title: currentDocument.value.title,
      blocks: currentDocument.value.blocks || currentDocument.value.content?.blocks
    }
  }
  return null
}

function insertTextIntoDocument(text) {
  if (!currentDocument.value) {
    console.warn('No document available for text insertion')
    return
  }
  
  // Find the last block or create a new one
  const blocks = currentDocument.value.blocks || currentDocument.value.content?.blocks || []
  
  if (blocks.length === 0) {
    // Create a new block if document is empty
    const newBlock = {
      id: Date.now().toString(),
      type: 'paragraph',
      content: text
    }
    
    if (currentDocument.value.blocks) {
      currentDocument.value.blocks.push(newBlock)
    } else if (currentDocument.value.content) {
      if (!currentDocument.value.content.blocks) {
        currentDocument.value.content.blocks = []
      }
      currentDocument.value.content.blocks.push(newBlock)
    }
  } else {
    // Append to the last block or create a new block
    const lastBlock = blocks[blocks.length - 1]
    if (lastBlock.type === 'paragraph' && !lastBlock.content?.trim()) {
      // Replace empty last block
      lastBlock.content = text
    } else {
      // Create new block
      const newBlock = {
        id: Date.now().toString(),
        type: 'paragraph',
        content: text
      }
      blocks.push(newBlock)
    }
  }
  
  console.log('✅ Inserted text into document:', text.substring(0, 50) + '...')
  
  // Update the document
  const updatedDocument = { ...currentDocument.value }
  updateCurrentDocument(updatedDocument)
}

// Title editing functions
const startEditingTitle = (doc) => {
  doc.originalTitle = doc.title
  doc.isEditing = true
  
  // Focus the input after Vue updates the DOM
  nextTick(() => {
    const titleInputs = document.querySelectorAll('.title-input')
    const currentInput = titleInputs[titleInputs.length - 1] // Get the last one (newest)
    if (currentInput) {
      currentInput.focus()
      currentInput.select() // Select all text
    }
  })
}

const stopEditingTitle = (doc) => {
  doc.isEditing = false
  
  // Validate title
  if (!doc.title.trim()) {
    doc.title = doc.originalTitle || 'Untitled Document'
  }
  
  console.log(`✏️ Renamed document to: "${doc.title}"`)
}

const cancelEditTitle = (doc) => {
  doc.title = doc.originalTitle
  doc.isEditing = false
  console.log('❌ Cancelled title edit')
}
</script>

<style scoped>
.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  overflow: hidden;
}

.workspace-area {
  height: 100%;
  padding: 20px;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

kbd {
  background: #f1f3f4;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 0.9em;
}

/* Layout styles */
.layout-split .documents-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.layout-grid .documents-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
}

.layout-single .documents-area {
  display: block;
}

.document-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
  outline: none;
}

.document-item:hover,
.document-item:focus {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.document-item:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.document-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.document-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.15s ease;
  flex: 1;
  min-height: 28px;
  display: flex;
  align-items: center;
}

.document-title:hover {
  background: #f3f4f6;
}

.title-input {
  font-size: 16px;
  font-weight: 600;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  padding: 4px 8px;
  background: white;
  outline: none;
  flex: 1;
  min-height: 28px;
}

.document-type {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 12px;
  letter-spacing: 0.025em;
}

.document-content {
  font-size: 14px;
  color: #6b7280;
  padding: 8px 0;
}

/* Focus mode */
.focus-mode .command-bar {
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.focus-mode .command-bar:hover {
  opacity: 1;
}

/* Dark mode */
:global(.dark) .app-shell {
  background: #1a1d23;
  color: #e5e7eb;
}

:global(.dark) .empty-state {
  color: #e5e7eb;
}

:global(.dark) .document-item {
  background: #2d3748;
  border-color: #4a5568;
  color: #e5e7eb;
}

:global(.dark) .document-title:hover {
  background: #4a5568;
}

:global(.dark) .title-input {
  background: #1a202c;
  color: #e5e7eb;
  border-color: #3182ce;
}

:global(.dark) .document-type {
  background: #4a5568;
  color: #cbd5e0;
}
</style>